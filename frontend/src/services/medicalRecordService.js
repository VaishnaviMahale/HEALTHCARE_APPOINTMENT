import api from './api';

const medicalRecordService = {
  // Get all medical records with filters
  getMedicalRecords: async (params = {}) => {
    const response = await api.get('/records', { params });
    return response;
  },

  // Get single medical record
  getMedicalRecord: async (id) => {
    const response = await api.get(`/records/${id}`);
    return response;
  },

  // Create medical record (doctor only)
  createMedicalRecord: async (recordData) => {
    const response = await api.post('/records', recordData);
    return response;
  },

  // Update medical record (doctor only)
  updateMedicalRecord: async (id, updateData) => {
    const response = await api.put(`/records/${id}`, updateData);
    return response;
  },

  // Delete medical record (doctor/admin only)
  deleteMedicalRecord: async (id) => {
    const response = await api.delete(`/records/${id}`);
    return response;
  },

  // Share medical record with another doctor
  shareMedicalRecord: async (id, doctorId, permissions = 'read') => {
    const response = await api.post(`/records/${id}/share`, {
      doctorId,
      permissions,
    });
    return response;
  },

  // Remove share access
  removeMedicalRecordShare: async (id, doctorId) => {
    const response = await api.delete(`/records/${id}/share/${doctorId}`);
    return response;
  },

  // Get patient's complete medical history
  getPatientMedicalHistory: async (patientId) => {
    const response = await api.get(`/records/patient/${patientId}/history`);
    return response;
  },

  // Get records by date range
  getRecordsByDateRange: async (patientId, startDate, endDate) => {
    const response = await api.get('/records', {
      params: {
        patientId,
        startDate,
        endDate,
      },
    });
    return response;
  },

  // Search records
  searchRecords: async (searchTerm, filters = {}) => {
    const response = await api.get('/records', {
      params: {
        search: searchTerm,
        ...filters,
      },
    });
    return response;
  },
};

export default medicalRecordService;
