import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default Wi-Fi IP of the host development machine, fallback for emulators
const DEFAULT_HOST_IP = process.env.EXPO_PUBLIC_HOST_IP || '192.168.137.1';
export const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: `http://${DEFAULT_HOST_IP}:6446/api`,
    ios: `http://${DEFAULT_HOST_IP}:6446/api`,
    default: 'http://localhost:6446/api',
  });

/**
 * Helper to construct dynamic web report URL resolving to current server baseURL
 */
export const getReportViewUrl = (appointmentId) => {
  const base = (api?.defaults?.baseURL || DEFAULT_BASE_URL).replace(/\/api\/?$/, '');
  return `${base}/api/appointments/${appointmentId}/report/view`;
};

/**
 * Helper to construct dynamic PDF binary download URL
 */
export const getReportPdfUrl = (appointmentId) => {
  const base = (api?.defaults?.baseURL || DEFAULT_BASE_URL).replace(/\/api\/?$/, '');
  return `${base}/api/appointments/${appointmentId}/report/pdf`;
};

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize custom URL if stored previously
AsyncStorage.getItem('biosync_user_api_url')
  .then((savedUrl) => {
    if (savedUrl) {
      api.defaults.baseURL = savedUrl;
    }
  })
  .catch(() => {});

// Allow dynamic server address override
export const setCustomApiUrl = async (url) => {
  if (!url) return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const formatted = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  api.defaults.baseURL = formatted;
  await AsyncStorage.setItem('biosync_user_api_url', formatted);
};

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('biosync_user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let onUnauthorizedCallback = null;

export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('biosync_user_token');
        await AsyncStorage.removeItem('biosync_user_profile');
        if (typeof onUnauthorizedCallback === 'function') {
          onUnauthorizedCallback();
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
