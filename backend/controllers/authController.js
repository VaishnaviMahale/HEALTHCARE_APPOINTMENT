const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    dateOfBirth,
    gender,
    address,
    // Doctor specific fields
    specialization,
    licenseNumber,
    experience,
    qualifications,
    consultationFee,
    bio
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const userData = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role,
    phone
  };

  // Add patient-specific fields
  if (role === 'patient') {
    if (!dateOfBirth || !gender) {
      return next(new AppError('Date of birth and gender are required for patients', 400));
    }
    userData.dateOfBirth = dateOfBirth;
    userData.gender = gender;
  }

  if (address) {
    userData.address = address;
  }

  const user = await User.create(userData);

  // If user is a doctor, create doctor profile
  if (role === 'doctor') {
    if (!specialization || !licenseNumber || experience === undefined || !consultationFee) {
      return next(new AppError('Specialization, license number, experience, and consultation fee are required for doctors', 400));
    }

    // Check if license number already exists
    const existingDoctor = await Doctor.findOne({ licenseNumber });
    if (existingDoctor) {
      // Clean up the created user
      await User.findByIdAndDelete(user._id);
      return next(new AppError('Doctor with this license number already exists', 400));
    }

    const doctorData = {
      user: user._id,
      specialization,
      licenseNumber,
      experience,
      consultationFee
    };

    if (qualifications) {
      doctorData.qualifications = qualifications;
    }

    if (bio) {
      doctorData.bio = bio;
    }

    await Doctor.create(doctorData);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  let userData = {
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    fullName: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
    profileImage: req.user.profileImage,
    isEmailVerified: req.user.isEmailVerified,
    address: req.user.address,
    createdAt: req.user.createdAt
  };

  // Add patient-specific data
  if (req.user.role === 'patient') {
    userData.dateOfBirth = req.user.dateOfBirth;
    userData.gender = req.user.gender;
    userData.age = req.user.age;
  }

  // Add doctor-specific data
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) {
      userData.doctorProfile = {
        id: doctor._id,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        bio: doctor.bio,
        consultationFee: doctor.consultationFee,
        availability: doctor.availability,
        rating: doctor.rating,
        isVerified: doctor.isVerified,
        totalPatients: doctor.totalPatients,
        totalAppointments: doctor.totalAppointments
      };
    }
  }

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // If email is being updated, check if it's already taken
  if (fieldsToUpdate.email) {
    const existingUser = await User.findOne({ 
      email: fieldsToUpdate.email.toLowerCase(),
      _id: { $ne: req.user._id }
    });
    
    if (existingUser) {
      return next(new AppError('Email is already taken', 400));
    }
    
    fieldsToUpdate.email = fieldsToUpdate.email.toLowerCase();
    fieldsToUpdate.isEmailVerified = false; // Reset email verification
  }

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // TODO: Send email with reset token
  // For now, we'll just return the token (in production, this should be sent via email)

  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email',
    resetToken: resetToken // Remove this in production
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    emailVerificationToken: req.params.token
  });

  if (!user) {
    return next(new AppError('Invalid verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail
};
