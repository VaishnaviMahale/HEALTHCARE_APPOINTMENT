const express = require('express');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats
} = require('../controllers/appointmentController');

const { protect, patientOnly, doctorOnly } = require('../middleware/auth');
const {
  validateAppointment,
  validateAppointmentUpdate,
  validatePagination,
  validateDateRange,
  validateMongoId
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// General appointment routes
router.get('/', validatePagination, validateDateRange, getAppointments);
router.get('/stats', getAppointmentStats);
router.get('/:id', validateMongoId('id'), getAppointment);

// Patient routes
router.post('/', patientOnly, validateAppointment, createAppointment);

// Routes accessible by both patients and doctors
router.put('/:id', validateMongoId('id'), validateAppointmentUpdate, updateAppointment);
router.delete('/:id', validateMongoId('id'), deleteAppointment);

module.exports = router;
