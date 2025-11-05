const express = require('express');
const {
  getUsers,
  getDoctors,
  getDoctor,
  getUserProfile,
  updateUserProfile,
  deactivateAccount,
  addDoctorReview,
  getUserStats
} = require('../controllers/userController');

const { protect, authorize, patientOnly, adminOnly } = require('../middleware/auth');
const {
  validatePagination,
  validateMongoId
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/doctors', validatePagination, getDoctors);
router.get('/doctors/:id', validateMongoId('id'), getDoctor);

// Protected routes
router.use(protect); // All routes after this middleware are protected

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/deactivate', deactivateAccount);

// Doctor review routes (Patient only)
router.post('/doctors/:id/reviews', patientOnly, validateMongoId('id'), addDoctorReview);

// Admin only routes
router.use(adminOnly);
router.get('/', validatePagination, getUsers);
router.get('/stats', getUserStats);

module.exports = router;
