import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('biosync_user_token'),
        AsyncStorage.getItem('biosync_user_profile'),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
        // Background refresh profile
        userApi.getProfile()
          .then((res) => {
            if (res.success && res.user) {
              set({ user: res.user });
              AsyncStorage.setItem('biosync_user_profile', JSON.stringify(res.user));
            }
          })
          .catch(() => {});
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (phoneNumber, otp) => {
    try {
      set({ isLoading: true, error: null });
      const res = await userApi.verifyOTP(phoneNumber, otp);

      if (res.success && res.token) {
        const user = res.user;
        const token = res.token;

        await Promise.all([
          AsyncStorage.setItem('biosync_user_token', token),
          AsyncStorage.setItem('biosync_user_profile', JSON.stringify(user)),
        ]);

        set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        return { success: true };
      } else {
        set({ isLoading: false, error: res.message || 'OTP verification failed' });
        return { success: false, message: res.message || 'OTP verification failed' };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      set({ isLoading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  logout: async () => {
    try {
      await userApi.logout();
    } catch (e) {}

    await Promise.all([
      AsyncStorage.removeItem('biosync_user_token'),
      AsyncStorage.removeItem('biosync_user_profile'),
    ]);

    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  updateUser: (updatedData) => {
    const updated = { ...get().user, ...updatedData };
    set({ user: updated });
    AsyncStorage.setItem('biosync_user_profile', JSON.stringify(updated));
  },
}));

export default useAuthStore;
