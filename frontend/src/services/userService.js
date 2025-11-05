import api from './api';

const userService = {
  // Get all users (admin only)
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response;
  },

  // Get all doctors
  getDoctors: async (params = {}) => {
    const response = await api.get('/users/doctors', { params });
    return response;
  },

  // Get single doctor
  getDoctor: async (id) => {
    const response = await api.get(`/users/doctors/${id}`);
    return response;
  },

  // Get user profile
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response;
  },

  // Update user profile
  updateUserProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response;
  },

  // Deactivate account
  deactivateAccount: async () => {
    const response = await api.put('/users/deactivate');
    return response;
  },

  // Add doctor review (patient only)
  addDoctorReview: async (doctorId, reviewData) => {
    const response = await api.post(`/users/doctors/${doctorId}/reviews`, reviewData);
    return response;
  },

  // Get user statistics (admin only)
  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response;
  },

  // Search doctors
  searchDoctors: async (searchTerm, filters = {}) => {
    const response = await api.get('/users/doctors', {
      params: {
        search: searchTerm,
        ...filters,
      },
    });
    return response;
  },

  // Get doctors by specialization
  getDoctorsBySpecialization: async (specialization) => {
    const response = await api.get('/users/doctors', {
      params: { specialization },
    });
    return response;
  },

  // Get available doctors for specific date/time
  getAvailableDoctors: async (date, time, specialization = null) => {
    const params = { date, time };
    if (specialization) params.specialization = specialization;
    
    const response = await api.get('/users/doctors', { params });
    return response;
  },
};

export default userService;
