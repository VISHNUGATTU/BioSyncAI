import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// API CONFIGURATION
// ============================================================

// Android Emulator:
// 10.0.2.2 points to your computer's localhost.
//
// Physical phone:
// Replace this with your computer's LAN IP, for example:
// http://192.168.1.100:5000/api
//
// If your backend is running on port 6446, use:
// http://10.0.2.2:6446/api

export const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:6446/api';

let currentBaseUrl = DEFAULT_BASE_URL;

// ============================================================
// AXIOS INSTANCE
// ============================================================

export const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// ============================================================
// SET BASE URL
// ============================================================

export const setApiBaseUrl = (baseUrl) => {
  if (!baseUrl || typeof baseUrl !== 'string') {
    console.warn('[Axios] Invalid base URL');
    return;
  }

  let normalizedUrl = baseUrl.trim();

  // Remove trailing slashes.
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');

  // Add /api if it is not already present.
  if (!normalizedUrl.endsWith('/api')) {
    normalizedUrl = `${normalizedUrl}/api`;
  }

  currentBaseUrl = normalizedUrl;

  api.defaults.baseURL = normalizedUrl;

  console.log(
    '[Axios] Base URL:',
    normalizedUrl
  );
};

// ============================================================
// GET CURRENT BASE URL
// ============================================================

export const getApiBaseUrl = () => {
  return currentBaseUrl;
};

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(
        '@staff_token'
      );

      config.headers = config.headers || {};

      // Always attach the JWT when available.
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Prevent an old Authorization header from being reused.
        delete config.headers.Authorization;
      }

      // Do not force application/json for multipart uploads.
      // Axios needs to generate the multipart boundary itself.
      const contentType =
        config.headers['Content-Type'] ||
        config.headers['content-type'];

      if (
        contentType &&
        contentType.includes('multipart/form-data')
      ) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }

      console.log(
        `[Axios] ${(
          config.method || 'GET'
        ).toUpperCase()} ${config.baseURL}${config.url}`,
        token
          ? '[TOKEN ATTACHED]'
          : '[NO TOKEN]'
      );

      return config;
    } catch (error) {
      console.warn(
        '[Axios] Token attachment failed:',
        error?.message || error
      );

      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

let isLoggingOut = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const status = error?.response?.status;

    const url =
      error?.config?.url ||
      'Unknown endpoint';

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    if (status === 401) {
      console.warn(
        `[Axios] 401 Unauthorized: ${url}`
      );

      console.warn(
        '[Axios] Server rejected the authentication token.'
      );

      // If the rejection was not on a login attempt, wipe stale tokens and reset session
      const isLoginAttempt = typeof url === 'string' && url.includes('/login');
      if (!isLoginAttempt && !isLoggingOut) {
        isLoggingOut = true;
        console.warn(
          '[Axios] Stale or invalid session detected. Clearing credentials & resetting auth state.'
        );
        try {
          await AsyncStorage.multiRemove(['@staff_token', '@staff_profile']);
          const { useAuthStore } = await import('../store/authStore');
          if (useAuthStore?.getState()?.logout) {
            await useAuthStore.getState().logout();
          }
        } catch (resetErr) {
          console.warn('[Axios] Session reset error:', resetErr?.message || resetErr);
        } finally {
          setTimeout(() => {
            isLoggingOut = false;
          }, 1500);
        }
      }
    } else if (status === 403) {
      console.warn(
        `[Axios] 403 Forbidden: ${url}`
      );
    } else {
      console.warn(
        `[Axios] ${status || 'NETWORK'} error: ${url}`,
        message
      );
    }

    return Promise.reject(error);
  }
);

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default api;