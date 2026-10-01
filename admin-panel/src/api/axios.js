import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:6446/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('biosync-admin-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getCertificateViewUrl = (id) => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:6446/api').replace(/\/api\/?$/, '');
  return `${base}/api/appointments/${id}/report/view`;
};

export const getCertificatePdfUrl = (id) => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:6446/api').replace(/\/api\/?$/, '');
  return `${base}/api/appointments/${id}/report/pdf`;
};

export default api;