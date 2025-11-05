import api from './api';

const appointmentService = {
  // Get all appointments with filters
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response;
  },

  // Get single appointment
  getAppointment: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response;
  },

  // Update appointment
  updateAppointment: async (id, updateData) => {
    const response = await api.put(`/appointments/${id}`, updateData);
    return response;
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response;
  },

  // Get appointment statistics
  getAppointmentStats: async () => {
    const response = await api.get('/appointments/stats');
    return response;
  },

  // Confirm appointment (doctor only)
  confirmAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}`, { status: 'confirmed' });
    return response;
  },

  // Cancel appointment
  cancelAppointment: async (id, cancellationReason) => {
    const response = await api.put(`/appointments/${id}`, {
      status: 'cancelled',
      cancellationReason,
    });
    return response;
  },

  // Complete appointment (doctor only)
  completeAppointment: async (id, completionData) => {
    const response = await api.put(`/appointments/${id}`, {
      status: 'completed',
      ...completionData,
    });
    return response;
  },

  // Reschedule appointment
  rescheduleAppointment: async (id, newDate, newTime) => {
    const response = await api.put(`/appointments/${id}`, {
      appointmentDate: newDate,
      appointmentTime: newTime,
    });
    return response;
  },

  // Get today's appointments
  getTodayAppointments: async () => {
    const response = await api.get('/appointments', { 
      params: { today: 'true' } 
    });
    return response;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async () => {
    const response = await api.get('/appointments', { 
      params: { upcoming: 'true' } 
    });
    return response;
  },
};

export default appointmentService;
