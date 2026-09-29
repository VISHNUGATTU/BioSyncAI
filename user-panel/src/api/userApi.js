import api from './axios';

export const userApi = {
  // Authentication
  requestOTP: async (phoneNumber) => {
    const res = await api.post('/users/request-otp', { phoneNumber });
    return res.data;
  },

  verifyOTP: async (phoneNumber, otp) => {
    const res = await api.post('/users/verify-otp', { phoneNumber, otp });
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/users/logout');
    } catch (e) {}
  },

  // Profile Management
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  },

  // Appointments Workflow
  getAppointments: async () => {
    const res = await api.get('/appointments');
    return res.data;
  },

  bookAppointment: async (payload) => {
    const res = await api.post('/appointments/book', payload);
    return res.data;
  },

  rescheduleAppointment: async (appointmentId, newDate, newSlot) => {
    const res = await api.put(`/appointments/${appointmentId}/reschedule`, {
      newScheduledDate: newDate,
      newTimeSlot: newSlot,
    });
    return res.data;
  },

  // Diagnostic Catalog
  getTestCatalog: async () => {
    const res = await api.get('/tests');
    return res.data;
  },

  // Health Reports & Vitals
  getReports: async () => {
    const res = await api.get('/users/reports');
    return res.data;
  },

  getLatestVitals: async () => {
    const res = await api.get('/vitals/latest');
    return res.data;
  },

  getVitalsTrends: async (params = {}) => {
    const res = await api.get('/vitals/trends', { params });
    return res.data;
  },

  getVitalsHistory: async () => {
    const res = await api.get('/vitals/history');
    return res.data;
  },

  // Food Intelligence & History
  getFoodHistory: async () => {
    const res = await api.get('/food/history');
    return res.data;
  },

  logMeal: async (mealPayload) => {
    const res = await api.post('/food/log', mealPayload);
    return res.data;
  },

  scanFood: async (formData) => {
    const res = await api.post('/food/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default userApi;
