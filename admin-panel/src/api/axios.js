import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

export default api;