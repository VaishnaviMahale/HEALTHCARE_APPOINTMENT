const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all appointments (with filtering and pagination)
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res, next) => {
  let query = {};

  // Role-based filtering
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return next(new AppError('Doctor profile not found', 404));
    }
    query.doctor = doctor._id;
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.appointmentDate = {};
    if (req.query.startDate) {
      query.appointmentDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.appointmentDate.$lte = new Date(req.query.endDate);
    }
  }

  // Filter by today's appointments
  if (req.query.today === 'true') {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    query.appointmentDate = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  // Filter by upcoming appointments
  if (req.query.upcoming === 'true') {
    query.appointmentDate = {
      $gte: new Date()
    };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Execute query
  let appointmentsQuery = Appointment.find(query)
    .populate('patient', 'firstName lastName email phone profileImage')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone profileImage'
      }
    })
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .skip(startIndex)
    .limit(limit);

  const appointments = await appointmentsQuery;
  const total = await Appointment.countDocuments(query);

  // Pagination result
  const pagination = {};
  
  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    pagination,
    data: appointments
  });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone profileImage dateOfBirth gender address')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone profileImage'
      }
    });

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }

  // Check access permissions
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return next(new AppError('Not authorized to access this appointment', 403));
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
const createAppointment = asyncHandler(async (req, res, next) => {
  const {
    doctorId,
    appointmentDate,
    appointmentTime,
    symptoms,
    type = 'consultation',
    duration = 30
  } = req.body;

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId).populate('user');
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Check if doctor is available on this day and time
  const appointmentDateTime = new Date(appointmentDate);
  const dayOfWeek = appointmentDateTime.getDay();
  
  if (!doctor.isAvailableAt(dayOfWeek, appointmentTime)) {
    return next(new AppError('Doctor is not available at this time', 400));
  }

  // Check for appointment conflicts
  const conflicts = await Appointment.findConflicts(
    doctorId,
    appointmentDate,
    appointmentTime,
    duration
  );

  if (conflicts.length > 0) {
    return next(new AppError('This time slot is already booked', 409));
  }

  // Create appointment
  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate,
    appointmentTime,
    symptoms,
    type,
    duration,
    fee: {
      amount: doctor.consultationFee,
      currency: 'USD'
    }
  });

  // Populate the created appointment
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('patient', 'firstName lastName email phone')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    });

  // Update doctor's total appointments count
  await Doctor.findByIdAndUpdate(doctorId, {
    $inc: { totalAppointments: 1 }
  });

  res.status(201).json({
    success: true,
    data: populatedAppointment
  });
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '_id'
      }
    });

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }

  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return next(new AppError('Not authorized to update this appointment', 403));
  }

  const {
    status,
    appointmentDate,
    appointmentTime,
    duration,
    cancellationReason,
    notes,
    prescriptions,
    vitalSigns,
    diagnosis,
    followUpDate
  } = req.body;

  // Handle different update scenarios
  if (status === 'cancelled') {
    if (!appointment.canBeCancelled()) {
      return next(new AppError('Appointment cannot be cancelled (too close to appointment time)', 400));
    }
    
    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = req.user._id;
  } else if (status === 'confirmed' && req.user.role === 'doctor') {
    appointment.status = 'confirmed';
  } else if (status === 'completed' && req.user.role === 'doctor') {
    appointment.status = 'completed';
    
    // Doctor can add medical information
    if (notes?.doctor) {
      appointment.notes.doctor = notes.doctor;
    }
    if (prescriptions) {
      appointment.prescriptions = prescriptions;
    }
    if (vitalSigns) {
      appointment.vitalSigns = vitalSigns;
    }
    if (diagnosis) {
      appointment.diagnosis = diagnosis;
    }
    if (followUpDate) {
      appointment.followUpDate = followUpDate;
    }
  } else if (isPatient && appointment.canBeRescheduled()) {
    // Patient can reschedule pending/confirmed appointments
    if (appointmentDate) {
      appointment.appointmentDate = appointmentDate;
    }
    if (appointmentTime) {
      // Check for conflicts if time is being changed
      if (appointmentTime !== appointment.appointmentTime) {
        const conflicts = await Appointment.findConflicts(
          appointment.doctor._id,
          appointmentDate || appointment.appointmentDate,
          appointmentTime,
          duration || appointment.duration,
          appointment._id
        );
        
        if (conflicts.length > 0) {
          return next(new AppError('This time slot is already booked', 409));
        }
      }
      appointment.appointmentTime = appointmentTime;
    }
    if (duration) {
      appointment.duration = duration;
    }
  }

  // Patient can add notes
  if (isPatient && notes?.patient) {
    appointment.notes.patient = notes.patient;
  }

  await appointment.save();

  // Populate updated appointment
  const updatedAppointment = await Appointment.findById(appointment._id)
    .populate('patient', 'firstName lastName email phone')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    });

  res.status(200).json({
    success: true,
    data: updatedAppointment
  });
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '_id'
      }
    });

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }

  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return next(new AppError('Not authorized to delete this appointment', 403));
  }

  // Only allow deletion if appointment is pending or if user is admin
  if (appointment.status !== 'pending' && !isAdmin) {
    return next(new AppError('Only pending appointments can be deleted', 400));
  }

  await appointment.deleteOne();

  // Update doctor's total appointments count
  await Doctor.findByIdAndUpdate(appointment.doctor._id, {
    $inc: { totalAppointments: -1 }
  });

  res.status(200).json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private
const getAppointmentStats = asyncHandler(async (req, res, next) => {
  let matchQuery = {};

  // Role-based filtering
  if (req.user.role === 'patient') {
    matchQuery.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return next(new AppError('Doctor profile not found', 404));
    }
    matchQuery.doctor = doctor._id;
  }

  const stats = await Appointment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get today's appointments count
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const todayCount = await Appointment.countDocuments({
    ...matchQuery,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  // Get upcoming appointments count
  const upcomingCount = await Appointment.countDocuments({
    ...matchQuery,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  });

  res.status(200).json({
    success: true,
    data: {
      statusCounts: stats,
      todayCount,
      upcomingCount
    }
  });
});

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats
};
