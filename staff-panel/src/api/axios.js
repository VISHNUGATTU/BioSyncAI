import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default Wi-Fi IP of the host development machine, fallback for emulators
const DEFAULT_HOST_IP = '192.168.137.1';
export const DEFAULT_BASE_URL = Platform.select({
  android: `http://${DEFAULT_HOST_IP}:6446/api`,
  ios: `http://${DEFAULT_HOST_IP}:6446/api`,
  default: `http://localhost:6446/api`,
});

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize base URL from AsyncStorage if user customized it
export const initializeApiBaseUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('@staff_api_base_url');
    if (savedUrl) {
      api.defaults.baseURL = savedUrl;
      return savedUrl;
    }
  } catch (e) {
    console.warn('Failed to load custom API base URL:', e);
  }
  return api.defaults.baseURL;
};

export const setApiBaseUrl = async (url) => {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    api.defaults.baseURL = finalUrl;
    await AsyncStorage.setItem('@staff_api_base_url', finalUrl);
    return finalUrl;
  } catch (e) {
    console.error('Failed to save API base URL:', e);
    throw e;
  }
};

export const getStoredBaseUrl = async () => {
  return await initializeApiBaseUrl();
};

export const saveStoredBaseUrl = async (url) => {
  return await setApiBaseUrl(url);
};

// Request interceptor to attach Lab Assistant JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@staff_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for logging & unauthorized handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Staff token expired or invalid, clearing local session');
      try {
        await AsyncStorage.multiRemove(['@staff_token', '@staff_profile']);
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default api;
