import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import staffApi from '../api/staffApi';

const TOKEN_KEY = '@staff_token';
const PROFILE_KEY = '@staff_profile';

const getProfileRole = (profile = {}, data = {}) => {
  return (
    data.role ||
    profile.role ||
    (data.doctor ? 'doctor' : 'lab_assistant')
  );
};

const normalizeProfile = (profile = {}, data = {}) => {
  return {
    ...profile,
    role: getProfileRole(profile, data),
  };
};

export const useAuthStore = create((set, get) => ({
  // ─────────────────────────────────────────────
  // AUTH STATE
  // ─────────────────────────────────────────────
  token: null,
  staff: null,
  user: null,

  role: 'lab_assistant',

  dutyStatus: 'Available',

  isLoading: true,

  isTrackingLocation: false,
  isLocationTracking: false,

  // ─────────────────────────────────────────────
  // LOAD STORED SESSION
  // ─────────────────────────────────────────────
  loadStoredSession: async () => {
    try {
      set({
        isLoading: true,
      });

      const [token, profileStr] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);

      if (!token || !profileStr) {
        set({
          token: null,
          staff: null,
          user: null,
          role: 'lab_assistant',
          dutyStatus: 'Available',
          isLoading: false,
        });

        return false;
      }

      let staff;

      try {
        staff = JSON.parse(profileStr);
      } catch (parseError) {
        console.warn(
          '[AuthStore] Invalid stored profile. Clearing session.'
        );

        await AsyncStorage.multiRemove([
          TOKEN_KEY,
          PROFILE_KEY,
        ]);

        set({
          token: null,
          staff: null,
          user: null,
          role: 'lab_assistant',
          dutyStatus: 'Available',
          isLoading: false,
        });

        return false;
      }

      const normalizedStaff = normalizeProfile(staff);

      set({
        token,
        staff: normalizedStaff,
        user: normalizedStaff,
        role: normalizedStaff.role || 'lab_assistant',
        dutyStatus:
          normalizedStaff.status || 'Available',
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.warn(
        '[AuthStore] Failed to load stored session:',
        error?.message || error
      );

      set({
        token: null,
        staff: null,
        user: null,
        role: 'lab_assistant',
        dutyStatus: 'Available',
        isLoading: false,
      });

      return false;
    }
  },

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  login: async (phone, password) => {
    try {
      set({
        isLoading: true,
      });

      const data = await staffApi.login(
        phone,
        password
      );

      if (!data?.success || !data?.token) {
        set({
          isLoading: false,
        });

        return {
          success: false,
          message:
            data?.message ||
            'Invalid server response',
        };
      }

      const profileUser = normalizeProfile(
        data.user ||
          data.labAssistant ||
          data.doctor ||
          {},
        data
      );

      const role = profileUser.role;

      const dutyStatus =
        profileUser.status || 'Available';

      await Promise.all([
        AsyncStorage.setItem(
          TOKEN_KEY,
          data.token
        ),

        AsyncStorage.setItem(
          PROFILE_KEY,
          JSON.stringify(profileUser)
        ),
      ]);

      set({
        token: data.token,
        staff: profileUser,
        user: profileUser,
        role,
        dutyStatus,
        isLoading: false,
      });

      return {
        success: true,
        role,
        user: profileUser,
        token: data.token,
      };
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        (status === 401
          ? 'Invalid phone number or password.'
          : error?.message) ||
        'Login failed. Please check your credentials.';

      console.error(
        '[AuthStore] Login failed:',
        status || '',
        message
      );

      set({
        isLoading: false,
      });

      return {
        success: false,
        message,
        status,
      };
    }
  },

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        PROFILE_KEY,
      ]);
    } catch (error) {
      console.warn(
        '[AuthStore] Error clearing storage on logout:',
        error?.message || error
      );
    }

    set({
      token: null,
      staff: null,
      user: null,

      role: 'lab_assistant',

      dutyStatus: 'Off_Duty',

      isLoading: false,

      isTrackingLocation: false,
      isLocationTracking: false,
    });
  },

  // ─────────────────────────────────────────────
  // DUTY STATUS
  // ─────────────────────────────────────────────
  setDutyStatus: async (newStatus) => {
    const previousStatus =
      get().dutyStatus;

    try {
      // Optimistic UI update.
      set({
        dutyStatus: newStatus,
      });

      const res =
        await staffApi.updateProfile({
          status: newStatus,
        });

      if (res?.success && res?.data) {
        const updatedStaff = {
          ...(get().staff || {}),
          ...res.data,
        };

        const normalizedStaff =
          normalizeProfile(updatedStaff);

        await AsyncStorage.setItem(
          PROFILE_KEY,
          JSON.stringify(normalizedStaff)
        );

        set({
          staff: normalizedStaff,
          user: normalizedStaff,

          role:
            normalizedStaff.role ||
            get().role,

          dutyStatus:
            normalizedStaff.status ||
            newStatus,
        });

        return {
          success: true,
          data: normalizedStaff,
        };
      }

      // Restore previous state if server rejected it.
      set({
        dutyStatus: previousStatus,
      });

      return {
        success: false,
        message:
          res?.message ||
          'Failed to update duty status',
      };
    } catch (error) {
      console.error(
        '[AuthStore] Failed to update duty status:',
        error?.response?.status ||
          '',
        error?.response?.data?.message ||
          error?.message
      );

      set({
        dutyStatus: previousStatus,
      });

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update duty status',
      };
    }
  },

  // ─────────────────────────────────────────────
  // UPDATE STAFF PROFILE
  // ─────────────────────────────────────────────
  updateStaffProfile: async (updatedData) => {
    try {
      const res =
        await staffApi.updateProfile(
          updatedData
        );

      if (res?.success && res?.data) {
        const updatedStaff = {
          ...(get().staff || {}),
          ...res.data,
        };

        const normalizedStaff =
          normalizeProfile(updatedStaff);

        await AsyncStorage.setItem(
          PROFILE_KEY,
          JSON.stringify(normalizedStaff)
        );

        set({
          staff: normalizedStaff,
          user: normalizedStaff,

          role:
            normalizedStaff.role ||
            get().role,

          dutyStatus:
            normalizedStaff.status ||
            get().dutyStatus,
        });

        return {
          success: true,
          data: normalizedStaff,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Update failed',
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Update failed';

      console.error(
        '[AuthStore] Profile update failed:',
        error?.response?.status ||
          '',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // LOCATION TRACKING
  // ─────────────────────────────────────────────
  toggleLocationTracking: (enabled) => {
    set({
      isTrackingLocation: enabled,
      isLocationTracking: enabled,
    });
  },

  setLocationTracking: (enabled) => {
    set({
      isTrackingLocation: enabled,
      isLocationTracking: enabled,
    });
  },

  // ─────────────────────────────────────────────
  // UPDATE LIVE LOCATION
  // ─────────────────────────────────────────────
  updateLocation: async ({
    latitude,
    longitude,
    accuracy,
  }) => {
    try {
      if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null
      ) {
        return {
          success: false,
          message: 'Invalid location coordinates',
        };
      }

      const res =
        await staffApi.updateLiveLocation(
          latitude,
          longitude,
          accuracy
        );

      return {
        success: true,
        data: res?.data,
      };
    } catch (error) {
      console.warn(
        '[AuthStore] Failed to update live location:',
        error?.response?.status ||
          '',
        error?.response?.data?.message ||
          error?.message
      );

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update live location',
      };
    }
  },

  // ─────────────────────────────────────────────
  // CLEAR SESSION
  // ─────────────────────────────────────────────
  clearSession: async () => {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        PROFILE_KEY,
      ]);
    } catch (error) {
      console.warn(
        '[AuthStore] Failed to clear session:',
        error?.message || error
      );
    }

    set({
      token: null,
      staff: null,
      user: null,

      role: 'lab_assistant',

      dutyStatus: 'Off_Duty',

      isLoading: false,

      isTrackingLocation: false,
      isLocationTracking: false,
    });
  },
}));

export default useAuthStore;