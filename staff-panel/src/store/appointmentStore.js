import { create } from 'zustand';
import staffApi from '../api/staffApi';

export const useAppointmentStore = create((set, get) => ({
  kpis: null,
  pendingAppointments: [],
  appointmentsList: [],
  appointments: [], // alias
  activeAppointment: null,
  collectedSamples: [],
  inTransitSamples: [], // alias
  allAssistantSamples: [],
  recentSamples: [],
  labQueue: [],
  earnings: null,
  loading: false,
  error: null,

  fetchDashboardData: async () => {
    try {
      set({ loading: true, error: null });
      const [kpisRes, pendingRes, collectedRes, allSamplesRes] = await Promise.all([
        staffApi.getDashboardKPIs(),
        staffApi.getPendingAppointments(),
        staffApi.getCollectedSamples(),
        staffApi.getAllAssistantSamples().catch(() => ({ success: false, data: [] })),
      ]);

      const pendingAppointments = pendingRes.success ? pendingRes.data : [];
      const collectedSamples = collectedRes.success ? collectedRes.data : [];
      const allAssistantSamples = allSamplesRes.success ? allSamplesRes.data : [];
      const recentSamples = kpisRes.success && kpisRes.data?.recentSamples ? kpisRes.data.recentSamples : allAssistantSamples.slice(0, 10);

      // Pick first active or pending task as spotlight
      const active = pendingAppointments.find(
        (a) => a.status === 'On_The_Way' || a.status === 'Arrived' || a.status === 'Collecting'
      ) || pendingAppointments[0] || null;

      set({
        kpis: kpisRes.success ? kpisRes.data : null,
        pendingAppointments,
        appointments: pendingAppointments,
        activeAppointment: active,
        collectedSamples,
        inTransitSamples: collectedSamples,
        allAssistantSamples,
        recentSamples,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      set({ error: err.message, loading: false });
    }
  },

  fetchAppointmentsByCategory: async (category = 'pending') => {
    try {
      set({ loading: true, error: null });
      const res = await staffApi.getAppointmentsByCategory(category);
      if (res.success) {
        set({ appointmentsList: res.data, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
    return [];
  },

  setActiveAppointment: (appointment) => {
    set({ activeAppointment: appointment });
  },

  updateStatus: async (appointmentId, status, collectionOTP = null) => {
    try {
      const res = await staffApi.updateAppointmentStatus(appointmentId, status, collectionOTP);
      if (res.success) {
        // Refresh dashboard and lists
        await get().fetchDashboardData();
        return { success: true };
      }
      return { success: false, message: 'Status transition failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Error updating status';
      return { success: false, message };
    }
  },

  collectSampleAndCOD: async (appointmentId, barcodeOrData, vitals = null, questionnaire = null, paymentDetails = null) => {
    try {
      const res = await staffApi.collectSampleAndCOD(appointmentId, barcodeOrData, vitals, questionnaire, paymentDetails);
      if (res.success) {
        await get().fetchDashboardData();
        return { success: true, sample: res.sample };
      }
      return { success: false, message: 'Sample collection failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Collection failed';
      return { success: false, message };
    }
  },

  recordAppointmentVitals: async (appointmentId, vitals) => {
    try {
      const res = await staffApi.recordAppointmentVitals(appointmentId, vitals);
      if (res.success) {
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to record vitals' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  rejectAppointment: async (appointmentId, reason, notes) => {
    try {
      const res = await staffApi.rejectSample(appointmentId, reason, notes);
      if (res.success) {
        await get().fetchDashboardData();
        return { success: true };
      }
      return { success: false, message: 'Rejection failed' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error rejecting sample' };
    }
  },

  fetchCollectedSamples: async () => {
    try {
      const res = await staffApi.getCollectedSamples();
      if (res.success) {
        set({ collectedSamples: res.data });
      }
    } catch (err) {
      console.warn('Error fetching collected samples:', err);
    }
  },

  fetchAllAssistantSamples: async () => {
    try {
      const res = await staffApi.getAllAssistantSamples();
      if (res.success) {
        set({ allAssistantSamples: res.data });
        return res.data;
      }
    } catch (err) {
      console.warn('Error fetching all assistant samples:', err);
    }
    return [];
  },

  dropoffSamplesToLab: async (sampleIds) => {
    try {
      const res = await staffApi.bulkLaboratoryDropoff(sampleIds);
      if (res.success) {
        await get().fetchDashboardData();
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Dropoff failed' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Dropoff error' };
    }
  },

  updateSampleResultsStatus: async (sampleId, resultsDone) => {
    try {
      const res = await staffApi.updateSampleResultsStatus(sampleId, resultsDone);
      if (res.success) {
        await Promise.all([
          get().fetchDashboardData(),
          get().fetchLabQueue(),
          get().fetchAllAssistantSamples(),
        ]);
        return { success: true, sample: res.sample };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  fetchLabQueue: async () => {
    try {
      const res = await staffApi.getProcessingQueue();
      if (res.success) {
        set({ labQueue: res.data });
      }
    } catch (err) {
      console.warn('Error fetching lab queue:', err);
    }
  },

  fetchEarnings: async () => {
    try {
      const res = await staffApi.getEarnings();
      if (res.success) {
        set({ earnings: res.data });
      }
    } catch (err) {
      console.warn('Error fetching earnings:', err);
    }
  },
}));

export default useAppointmentStore;
