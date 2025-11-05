const express = require('express');
const {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  shareMedicalRecord,
  removeMedicalRecordShare,
  getPatientMedicalHistory,
  deleteMedicalRecord
} = require('../controllers/medicalRecordController');

const { protect, doctorOnly, authorize } = require('../middleware/auth');
const {
  validateMedicalRecord,
  validatePagination,
  validateDateRange,
  validateMongoId
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// General medical record routes
router.get('/', validatePagination, validateDateRange, getMedicalRecords);
router.get('/:id', validateMongoId('id'), getMedicalRecord);

// Patient medical history (accessible by patient, doctors with access, and admin)
router.get('/patient/:patientId/history', validateMongoId('patientId'), getPatientMedicalHistory);

// Doctor only routes
router.post('/', doctorOnly, validateMedicalRecord, createMedicalRecord);
router.put('/:id', doctorOnly, validateMongoId('id'), updateMedicalRecord);
router.post('/:id/share', doctorOnly, validateMongoId('id'), shareMedicalRecord);
router.delete('/:id/share/:doctorId', doctorOnly, validateMongoId('id'), validateMongoId('doctorId'), removeMedicalRecordShare);

// Doctor and Admin routes
router.delete('/:id', authorize('doctor', 'admin'), validateMongoId('id'), deleteMedicalRecord);

module.exports = router;
