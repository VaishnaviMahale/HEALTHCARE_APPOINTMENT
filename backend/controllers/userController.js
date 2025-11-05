const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await User.countDocuments(query);

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
    count: users.length,
    total,
    pagination,
    data: users
  });
});

// @desc    Get all doctors with their profiles
// @route   GET /api/users/doctors
// @access  Public
const getDoctors = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  let query = { isVerified: true }; // Only show verified doctors

  // Filter by specialization
  if (req.query.specialization) {
    query.specialization = req.query.specialization;
  }

  // Filter by rating
  if (req.query.minRating) {
    query['rating.average'] = { $gte: parseFloat(req.query.minRating) };
  }

  // Filter by consultation fee range
  if (req.query.minFee || req.query.maxFee) {
    query.consultationFee = {};
    if (req.query.minFee) {
      query.consultationFee.$gte = parseFloat(req.query.minFee);
    }
    if (req.query.maxFee) {
      query.consultationFee.$lte = parseFloat(req.query.maxFee);
    }
  }

  // Search by name
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    const userIds = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex }
      ],
      role: 'doctor'
    }).select('_id');
    
    query.user = { $in: userIds.map(user => user._id) };
  }

  // Sort options
  let sortOption = { 'rating.average': -1 }; // Default: highest rated first
  
  if (req.query.sort === 'experience') {
    sortOption = { experience: -1 };
  } else if (req.query.sort === 'fee_low') {
    sortOption = { consultationFee: 1 };
  } else if (req.query.sort === 'fee_high') {
    sortOption = { consultationFee: -1 };
  } else if (req.query.sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  const doctors = await Doctor.find(query)
    .populate('user', 'firstName lastName email phone profileImage isActive')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limit);

  // Filter out doctors with inactive users
  const activeDoctors = doctors.filter(doctor => doctor.user && doctor.user.isActive);

  const total = await Doctor.countDocuments(query);

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
    count: activeDoctors.length,
    total,
    pagination,
    filters: {
      specializations: await Doctor.distinct('specialization'),
      consultationFeeRange: await Doctor.aggregate([
        { $group: { _id: null, min: { $min: '$consultationFee' }, max: { $max: '$consultationFee' } } }
      ])
    },
    data: activeDoctors
  });
});

// @desc    Get single doctor with full profile
// @route   GET /api/users/doctors/:id
// @access  Public
const getDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'firstName lastName email phone profileImage address createdAt')
    .populate({
      path: 'reviews.patient',
      select: 'firstName lastName profileImage'
    });

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (!doctor.user || !doctor.user.isActive) {
    return next(new AppError('Doctor profile is not available', 404));
  }

  // Get recent reviews (limit to 10 most recent)
  const recentReviews = doctor.reviews
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const doctorData = {
    ...doctor.toObject(),
    reviews: recentReviews
  };

  res.status(200).json({
    success: true,
    data: doctorData
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res, next) => {
  let userData = await User.findById(req.user._id)
    .select('-password')
    .lean();

  // Add doctor-specific data if user is a doctor
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (doctorProfile) {
      userData.doctorProfile = doctorProfile;
    }
  }

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address,
    profileImage: req.body.profileImage
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // Patient-specific fields
  if (req.user.role === 'patient') {
    if (req.body.dateOfBirth) fieldsToUpdate.dateOfBirth = req.body.dateOfBirth;
    if (req.body.gender) fieldsToUpdate.gender = req.body.gender;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  // Update doctor profile if user is a doctor
  if (req.user.role === 'doctor') {
    const doctorFields = {
      bio: req.body.bio,
      consultationFee: req.body.consultationFee,
      availability: req.body.availability,
      hospital: req.body.hospital
    };

    // Remove undefined fields
    Object.keys(doctorFields).forEach(key => {
      if (doctorFields[key] === undefined) {
        delete doctorFields[key];
      }
    });

    if (Object.keys(doctorFields).length > 0) {
      await Doctor.findOneAndUpdate(
        { user: req.user._id },
        doctorFields,
        {
          new: true,
          runValidators: true
        }
      );
    }
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Deactivate user account
// @route   PUT /api/users/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if user has any pending/confirmed appointments
  const upcomingAppointments = await Appointment.countDocuments({
    $or: [
      { patient: req.user._id },
      { doctor: req.user._id }
    ],
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  });

  if (upcomingAppointments > 0) {
    return next(new AppError('Cannot deactivate account with upcoming appointments', 400));
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// @desc    Add review for doctor (Patient only)
// @route   POST /api/users/doctors/:id/reviews
// @access  Private/Patient
const addDoctorReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Check if patient has had a completed appointment with this doctor
  const completedAppointment = await Appointment.findOne({
    patient: req.user._id,
    doctor: req.params.id,
    status: 'completed'
  });

  if (!completedAppointment) {
    return next(new AppError('You can only review doctors after a completed appointment', 400));
  }

  // Check if user has already reviewed this doctor
  const existingReview = doctor.reviews.find(
    review => review.patient.toString() === req.user._id.toString()
  );

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.date = new Date();
  } else {
    // Add new review
    doctor.reviews.push({
      patient: req.user._id,
      rating,
      comment,
      date: new Date()
    });
  }

  await doctor.save(); // This will trigger the rating update middleware

  const updatedDoctor = await Doctor.findById(req.params.id)
    .populate('reviews.patient', 'firstName lastName profileImage');

  res.status(200).json({
    success: true,
    data: updatedDoctor.reviews
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        }
      }
    }
  ]);

  // Get registration trends (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const registrationTrends = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      userCounts: stats,
      registrationTrends
    }
  });
});

module.exports = {
  getUsers,
  getDoctors,
  getDoctor,
  getUserProfile,
  updateUserProfile,
  deactivateAccount,
  addDoctorReview,
  getUserStats
};
