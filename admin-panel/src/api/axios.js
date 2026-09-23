import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:6446/api', // Connect directly to backend
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
