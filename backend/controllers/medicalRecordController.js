const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get medical records with filtering
// @route   GET /api/records
// @access  Private
const getMedicalRecords = asyncHandler(async (req, res, next) => {
  let query = {};

  // Role-based filtering
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return next(new AppError('Doctor profile not found', 404));
    }
    
    // Doctor can see records they created or records shared with them
    query.$or = [
      { doctor: doctor._id },
      { 'sharedWith.doctor': doctor._id }
    ];
  }

  // Filter by patient (for doctors and admins)
  if (req.query.patientId && (req.user.role === 'doctor' || req.user.role === 'admin')) {
    query.patient = req.query.patientId;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.visitDate = {};
    if (req.query.startDate) {
      query.visitDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.visitDate.$lte = new Date(req.query.endDate);
    }
  }

  // Search in diagnosis or notes
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const records = await MedicalRecord.find(query)
    .populate('patient', 'firstName lastName email phone dateOfBirth gender')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .populate('appointment', 'appointmentDate appointmentTime status')
    .sort({ visitDate: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await MedicalRecord.countDocuments(query);

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
    count: records.length,
    total,
    pagination,
    data: records
  });
});

// @desc    Get single medical record
// @route   GET /api/records/:id
// @access  Private
const getMedicalRecord = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone dateOfBirth gender address')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    })
    .populate('appointment', 'appointmentDate appointmentTime status type')
    .populate('sharedWith.doctor', 'user specialization');

  if (!record) {
    return next(new AppError('Medical record not found', 404));
  }

  // Check access permissions
  const isPatient = record.patient._id.toString() === req.user._id.toString();
  const isCreatingDoctor = record.doctor.user._id.toString() === req.user._id.toString();
  const isSharedDoctor = record.sharedWith.some(
    share => share.doctor.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isCreatingDoctor && !isSharedDoctor && !isAdmin) {
    return next(new AppError('Not authorized to access this medical record', 403));
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

// @desc    Create medical record
// @route   POST /api/records
// @access  Private (Doctor only)
const createMedicalRecord = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    appointmentId,
    chiefComplaint,
    historyOfPresentIllness,
    pastMedicalHistory,
    familyHistory,
    socialHistory,
    physicalExamination,
    diagnosticTests,
    diagnosis,
    treatment,
    followUp,
    additionalNotes,
    isConfidential = false
  } = req.body;

  // Verify doctor profile
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    return next(new AppError('Doctor profile not found', 404));
  }

  // Verify patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    return next(new AppError('Patient not found', 404));
  }

  // Verify appointment exists and belongs to the doctor
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: doctor._id,
    patient: patientId
  });

  if (!appointment) {
    return next(new AppError('Appointment not found or not associated with this doctor', 404));
  }

  // Check if medical record already exists for this appointment
  const existingRecord = await MedicalRecord.findOne({ appointment: appointmentId });
  if (existingRecord) {
    return next(new AppError('Medical record already exists for this appointment', 400));
  }

  // Create medical record
  const medicalRecord = await MedicalRecord.create({
    patient: patientId,
    doctor: doctor._id,
    appointment: appointmentId,
    visitDate: appointment.appointmentDate,
    chiefComplaint,
    historyOfPresentIllness,
    pastMedicalHistory,
    familyHistory,
    socialHistory,
    physicalExamination,
    diagnosticTests,
    diagnosis,
    treatment,
    followUp,
    additionalNotes,
    isConfidential
  });

  // Update appointment status to completed if not already
  if (appointment.status !== 'completed') {
    appointment.status = 'completed';
    await appointment.save();
  }

  // Populate the created record
  const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
    .populate('patient', 'firstName lastName email phone dateOfBirth gender')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .populate('appointment', 'appointmentDate appointmentTime status type');

  res.status(201).json({
    success: true,
    data: populatedRecord
  });
});

// @desc    Update medical record
// @route   PUT /api/records/:id
// @access  Private (Doctor only - creating doctor or shared doctor with write permission)
const updateMedicalRecord = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '_id'
      }
    });

  if (!record) {
    return next(new AppError('Medical record not found', 404));
  }

  // Check if user is the creating doctor
  const isCreatingDoctor = record.doctor.user._id.toString() === req.user._id.toString();
  
  // Check if user is a shared doctor with write permission
  const sharedAccess = record.sharedWith.find(
    share => share.doctor.toString() === req.user._id.toString() && share.permissions === 'read-write'
  );
  
  const isAdmin = req.user.role === 'admin';

  if (!isCreatingDoctor && !sharedAccess && !isAdmin) {
    return next(new AppError('Not authorized to update this medical record', 403));
  }

  // Update fields
  const updateFields = [
    'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
    'familyHistory', 'socialHistory', 'physicalExamination', 'diagnosticTests',
    'diagnosis', 'treatment', 'followUp', 'additionalNotes', 'isConfidential'
  ];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      record[field] = req.body[field];
    }
  });

  await record.save();

  // Populate updated record
  const updatedRecord = await MedicalRecord.findById(record._id)
    .populate('patient', 'firstName lastName email phone dateOfBirth gender')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .populate('appointment', 'appointmentDate appointmentTime status type');

  res.status(200).json({
    success: true,
    data: updatedRecord
  });
});

// @desc    Share medical record with another doctor
// @route   POST /api/records/:id/share
// @access  Private (Doctor only - creating doctor)
const shareMedicalRecord = asyncHandler(async (req, res, next) => {
  const { doctorId, permissions = 'read' } = req.body;

  const record = await MedicalRecord.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '_id'
      }
    });

  if (!record) {
    return next(new AppError('Medical record not found', 404));
  }

  // Check if user is the creating doctor
  const isCreatingDoctor = record.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreatingDoctor && !isAdmin) {
    return next(new AppError('Only the creating doctor can share this record', 403));
  }

  // Verify the doctor to share with exists
  const doctorToShareWith = await Doctor.findById(doctorId);
  if (!doctorToShareWith) {
    return next(new AppError('Doctor not found', 404));
  }

  // Check if already shared with this doctor
  const existingShare = record.sharedWith.find(
    share => share.doctor.toString() === doctorId
  );

  if (existingShare) {
    // Update permissions
    existingShare.permissions = permissions;
    existingShare.sharedDate = new Date();
  } else {
    // Add new share
    record.sharedWith.push({
      doctor: doctorId,
      permissions,
      sharedDate: new Date()
    });
  }

  await record.save();

  const updatedRecord = await MedicalRecord.findById(record._id)
    .populate('sharedWith.doctor', 'user specialization');

  res.status(200).json({
    success: true,
    message: 'Medical record shared successfully',
    data: updatedRecord.sharedWith
  });
});

// @desc    Remove share access for medical record
// @route   DELETE /api/records/:id/share/:doctorId
// @access  Private (Doctor only - creating doctor)
const removeMedicalRecordShare = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',  
        select: '_id'
      }
    });

  if (!record) {
    return next(new AppError('Medical record not found', 404));
  }

  // Check if user is the creating doctor
  const isCreatingDoctor = record.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreatingDoctor && !isAdmin) {
    return next(new AppError('Only the creating doctor can manage sharing', 403));
  }

  // Remove the share
  record.sharedWith = record.sharedWith.filter(
    share => share.doctor.toString() !== req.params.doctorId
  );

  await record.save();

  res.status(200).json({
    success: true,
    message: 'Share access removed successfully'
  });
});

// @desc    Get patient's complete medical history
// @route   GET /api/records/patient/:patientId/history
// @access  Private
const getPatientMedicalHistory = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;

  // Check permissions
  const isPatient = req.user._id.toString() === patientId;
  const isAdmin = req.user.role === 'admin';
  
  let canAccess = isPatient || isAdmin;

  // If user is a doctor, check if they have access to patient's records
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) {
      const hasAccess = await MedicalRecord.exists({
        patient: patientId,
        $or: [
          { doctor: doctor._id },
          { 'sharedWith.doctor': doctor._id }
        ]
      });
      canAccess = canAccess || hasAccess;
    }
  }

  if (!canAccess) {
    return next(new AppError('Not authorized to access this patient\'s medical history', 403));
  }

  // Get medical history
  const records = await MedicalRecord.getPatientHistory(patientId);

  // Get patient information
  const patient = await User.findById(patientId).select('firstName lastName email phone dateOfBirth gender');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      patient,
      records,
      totalRecords: records.length
    }
  });
});

// @desc    Delete medical record
// @route   DELETE /api/records/:id
// @access  Private (Doctor only - creating doctor or admin)
const deleteMedicalRecord = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '_id'
      }
    });

  if (!record) {
    return next(new AppError('Medical record not found', 404));
  }

  // Check if user is the creating doctor or admin
  const isCreatingDoctor = record.doctor.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreatingDoctor && !isAdmin) {
    return next(new AppError('Not authorized to delete this medical record', 403));
  }

  await record.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Medical record deleted successfully'
  });
});

module.exports = {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  shareMedicalRecord,
  removeMedicalRecordShare,
  getPatientMedicalHistory,
  deleteMedicalRecord
};
