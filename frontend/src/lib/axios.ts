import axios from 'axios';
import Cookies from 'js-cookie';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/store/backend/public/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// إرفاق التوكن تلقائياً مع كل طلب
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('merchant_token') || (typeof window !== 'undefined' ? localStorage.getItem('merchant_token') : null);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

