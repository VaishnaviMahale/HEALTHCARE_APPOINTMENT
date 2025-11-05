const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
    
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('role')
    .isIn(['patient', 'doctor'])
    .withMessage('Role must be either patient or doctor'),
    
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

// Doctor validation rules
const validateDoctorProfile = [
  body('specialization')
    .notEmpty()
    .withMessage('Specialization is required')
    .isIn([
      'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology',
      'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
      'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology',
      'Surgery', 'Urology', 'Gynecology', 'Ophthalmology',
      'ENT', 'Emergency Medicine', 'Anesthesiology', 'Pathology'
    ])
    .withMessage('Invalid specialization'),
    
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required'),
    
  body('experience')
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative number'),
    
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
    
  handleValidationErrors
];

// Appointment validation rules
const validateAppointment = [
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
    
  body('appointmentDate')
    .isISO8601()
    .withMessage('Invalid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date must be in the future');
      }
      return true;
    }),
    
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format'),
    
  body('symptoms')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Symptoms description cannot exceed 500 characters'),
    
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup'])
    .withMessage('Invalid appointment type'),
    
  handleValidationErrors
];

const validateAppointmentUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
    
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid appointment date'),
    
  body('appointmentTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM format'),
    
  body('cancellationReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),
    
  handleValidationErrors
];

// Medical record validation rules
const validateMedicalRecord = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),
    
  body('appointmentId')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
    
  body('chiefComplaint')
    .trim()
    .notEmpty()
    .withMessage('Chief complaint is required')
    .isLength({ max: 500 })
    .withMessage('Chief complaint cannot exceed 500 characters'),
    
  body('diagnosis.primary')
    .trim()
    .notEmpty()
    .withMessage('Primary diagnosis is required')
    .isLength({ max: 200 })
    .withMessage('Primary diagnosis cannot exceed 200 characters'),
    
  body('physicalExamination.vitalSigns.bloodPressure.systolic')
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage('Systolic blood pressure must be between 50 and 300'),
    
  body('physicalExamination.vitalSigns.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 30, max: 200 })
    .withMessage('Diastolic blood pressure must be between 30 and 200'),
    
  body('physicalExamination.vitalSigns.heartRate')
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage('Heart rate must be between 30 and 250'),
    
  body('physicalExamination.vitalSigns.temperature')
    .optional()
    .isFloat({ min: 90, max: 115 })
    .withMessage('Temperature must be between 90°F and 115°F'),
    
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
    
  handleValidationErrors
];

// ID parameter validation
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateDoctorProfile,
  validateAppointment,
  validateAppointmentUpdate,
  validateMedicalRecord,
  validatePagination,
  validateDateRange,
  validateMongoId
};
