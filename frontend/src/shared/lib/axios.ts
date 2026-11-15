import axios from 'axios';
import Cookies from 'js-cookie';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token =
    Cookies.get('merchant_token') ||
    (typeof window !== 'undefined' ? localStorage.getItem('merchant_token') : null);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    // Let the browser set multipart/form-data with its exact boundary
    delete config.headers['Content-Type'];
  }
  return config;
});

export default apiClient;

