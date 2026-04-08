import axios from 'axios';

export const BASE_URL = 'http://192.168.137.1:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;