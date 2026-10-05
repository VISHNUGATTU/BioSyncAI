import api from './axios';

export const userApi = {
  // Authentication
  requestOTP: async (phoneNumber) => {
    const res = await api.post('/users/request-otp', { phoneNumber });
    return res.data;
  },

  verifyOTP: async (phoneNumber, otp, idToken = null) => {
    const res = await api.post('/users/verify-otp', { phoneNumber, otp, idToken });
    return res.data;
  },

  getFirebaseConfig: async () => {
    const res = await api.get('/users/firebase-config');
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

  cancelAppointment: async (appointmentId) => {
    const res = await api.delete(`/appointments/${appointmentId}/cancel`);
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

  // Initial Health Assessment Setup (Manual Entry & Report OCR)
  addManualVitals: async (payload) => {
    const res = await api.post('/vitals/manual', payload);
    return res.data;
  },

  extractReportVitals: async (formData) => {
    const res = await api.post('/vitals/extract-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  confirmExtractedVitals: async (payload) => {
    const res = await api.post('/vitals/confirm-extracted', payload);
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

  getUnconfirmedScan: async () => {
    const res = await api.get('/food/unconfirmed');
    return res.data;
  },

  confirmFoodConsumption: async (id, payload) => {
    const res = await api.put(`/food/${id}/confirm`, payload);
    return res.data;
  },

  // Multi-step Draft Persistence ("Never Lose User Progress")
  getDraft: async (draftType) => {
    try {
      const res = await api.get(`/users/drafts/${draftType}`);
      return res.data;
    } catch (e) {
      return { success: false, draft: null };
    }
  },

  saveDraft: async (draftType, { step = 1, totalSteps = 1, data = {} }) => {
    try {
      const res = await api.put(`/users/drafts/${draftType}`, {
        step,
        totalSteps,
        data,
      });
      return res.data;
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  deleteDraft: async (draftType) => {
    try {
      const res = await api.delete(`/users/drafts/${draftType}`);
      return res.data;
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  // Support & Complaint Ticketing
  getMyTickets: async (page = 1) => {
    const res = await api.get('/tickets/my', { params: { page } });
    return res.data;
  },

  getTickets: async (page = 1) => {
    const res = await api.get('/tickets/my', { params: { page } });
    return res.data;
  },

  createTicket: async ({ subject, category, description, priority, appointmentId } = {}) => {
    const res = await api.post('/tickets', {
      subject,
      category,
      description,
      priority,
      appointmentId,
    });
    return res.data;
  },

  replyTicket: async (ticketId, message) => {
    const res = await api.post(`/tickets/${ticketId}/reply`, { message });
    return res.data;
  },

  // Official Medical Diagnostic Report Details
  getReportDetails: async (appointmentId) => {
    const res = await api.get(`/appointments/${appointmentId}/report`);
    return res.data;
  },

  // In-App Notification Center
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  // Longitudinal Health Timeline (Phase 4)
  getHealthTimeline: async (params = {}) => {
    const res = await api.get('/users/health-timeline', { params });
    return res.data;
  },

  // Native Report Sharing & Preview (Phase 5)
  getReportShareData: async (appointmentId) => {
    const res = await api.get(`/appointments/${appointmentId}/report/share-data`);
    return res.data;
  },
};

export default userApi;
