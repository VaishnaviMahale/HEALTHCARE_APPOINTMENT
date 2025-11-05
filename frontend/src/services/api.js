import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          // Not found
          toast.error('The requested resource was not found');
          break;
          
        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later');
          break;
          
        default:
          // Other errors
          const errorMessage = data?.error || data?.message || 'An error occurred';
          toast.error(errorMessage);
      }
      
      return Promise.reject({
        message: data?.error || data?.message || 'Request failed',
        status,
        data,
      });
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection');
      return Promise.reject({
        message: 'Network error',
        status: 0,
      });
    } else {
      // Other error
      toast.error('An unexpected error occurred');
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

export default api;
