import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import staffApi from '../api/staffApi';

export const useAuthStore = create((set, get) => ({
  token: null,
  staff: null,
  user: null, // alias for staff or doctor
  role: 'lab_assistant', // 'lab_assistant' | 'doctor'
  dutyStatus: 'Available',
  isLoading: true,
  isTrackingLocation: false,
  isLocationTracking: false, // alias

  loadStoredSession: async () => {
    try {
      set({ isLoading: true });
      const [token, profileStr] = await Promise.all([
        AsyncStorage.getItem('@staff_token'),
        AsyncStorage.getItem('@staff_profile'),
      ]);

      if (token && profileStr) {
        const staff = JSON.parse(profileStr);
        set({
          token,
          staff,
          user: staff,
          role: staff.role || 'lab_assistant',
          dutyStatus: staff.status || 'Available',
          isLoading: false,
        });
        return true;
      }
    } catch (e) {
      console.warn('Failed to load staff session:', e);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  login: async (phone, password) => {
    try {
      const data = await staffApi.login(phone, password);
      if (data.success && data.token) {
        const profileUser = data.user || data.labAssistant || data.doctor || {};
        profileUser.role = data.role || profileUser.role || (data.doctor ? 'doctor' : 'lab_assistant');
        
        await Promise.all([
          AsyncStorage.setItem('@staff_token', data.token),
          AsyncStorage.setItem('@staff_profile', JSON.stringify(profileUser)),
        ]);

        set({
          token: data.token,
          staff: profileUser,
          user: profileUser,
          role: profileUser.role,
          dutyStatus: profileUser.status || 'Available',
        });
        return { success: true, role: profileUser.role };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['@staff_token', '@staff_profile']);
    } catch (e) {
      console.warn('Error clearing storage on logout:', e);
    }
    set({
      token: null,
      staff: null,
      user: null,
      dutyStatus: 'Off_Duty',
      isTrackingLocation: false,
      isLocationTracking: false,
    });
  },

  setDutyStatus: async (newStatus) => {
    try {
      // Optimistic update
      set({ dutyStatus: newStatus });
      const res = await staffApi.updateProfile({ status: newStatus });
      if (res.success && res.data) {
        const updatedStaff = { ...get().staff, ...res.data };
        await AsyncStorage.setItem('@staff_profile', JSON.stringify(updatedStaff));
        set({ staff: updatedStaff, user: updatedStaff, dutyStatus: res.data.status });
      }
    } catch (error) {
      console.error('Failed to update duty status on server:', error);
      // Revert if failed
      if (get().staff?.status) {
        set({ dutyStatus: get().staff.status });
      }
    }
  },

  updateStaffProfile: async (updatedData) => {
    try {
      const res = await staffApi.updateProfile(updatedData);
      if (res.success && res.data) {
        const staff = { ...get().staff, ...res.data };
        await AsyncStorage.setItem('@staff_profile', JSON.stringify(staff));
        set({ staff, user: staff });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  },

  toggleLocationTracking: (enabled) => {
    set({ isTrackingLocation: enabled, isLocationTracking: enabled });
  },

  setLocationTracking: (enabled) => {
    set({ isTrackingLocation: enabled, isLocationTracking: enabled });
  },

  updateLocation: async ({ latitude, longitude, accuracy }) => {
    try {
      await staffApi.updateLiveLocation(latitude, longitude);
    } catch (err) {
      console.log('[AuthStore] Failed to update live location:', err.message);
    }
  },
}));

export default useAuthStore;
