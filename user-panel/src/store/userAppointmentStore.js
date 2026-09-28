import { create } from 'zustand';
import userApi from '../api/userApi';

const ACTIVE_STATUSES = [
  'Booked',
  'Pending',
  'Confirmed',
  'Assistant_Assigned',
  'Assigned',
  'On_The_Way',
  'On_Route',
  'Arrived',
  'Collecting',
  'Sample_Collected',
  'At_Laboratory',
  'Processing',
];

export const useUserAppointmentStore = create((set, get) => ({
  appointments: [],
  activeAppointment: null,
  testCatalog: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchAppointments: async (isSilent = false) => {
    try {
      if (!isSilent) set({ isLoading: true, error: null });

      const res = await userApi.getAppointments();

      if (res.success && Array.isArray(res.appointments)) {
        const appointments = res.appointments;
        // Find the active ongoing appointment
        const active = appointments.find((a) => ACTIVE_STATUSES.includes(a.status)) || null;

        set({
          appointments,
          activeAppointment: active,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return { success: true, appointments, active };
      } else {
        set({ isLoading: false, isRefreshing: false });
        return { success: false };
      }
    } catch (err) {
      if (!isSilent) {
        set({
          isLoading: false,
          isRefreshing: false,
          error: err.response?.data?.message || err.message || 'Failed to load appointments',
        });
      }
      return { success: false, error: err.message };
    }
  },

  fetchTestCatalog: async () => {
    try {
      const res = await userApi.getTestCatalog();
      const tests = res.tests || res.data || [];
      if (Array.isArray(tests)) {
        set({ testCatalog: tests });
      }
    } catch (e) {
      console.log('[Catalog] Failed to load catalog:', e.message);
    }
  },

  bookAppointment: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await userApi.bookAppointment(payload);
      if (res.success && res.appointment) {
        // Refresh full queue
        await get().fetchAppointments();
        return { success: true, appointment: res.appointment };
      } else {
        set({ isLoading: false, error: res.message || 'Booking failed' });
        return { success: false, message: res.message || 'Booking failed' };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to book appointment';
      set({ isLoading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },
}));

export default useUserAppointmentStore;
