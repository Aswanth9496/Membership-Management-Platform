import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth instance - withCredentials: true so browser SAVES the cookie on login response
const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true, // ✅ FIXED: was false, cookie was never saved by browser
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for main API
api.interceptors.request.use(
  (config) => {
    // ✅ Browser automatically sends the httpOnly cookie via withCredentials: true
    // No need to manually read document.cookie (won't work for httpOnly cookies anyway)

    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor for auth API
authApi.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`🔐 Auth Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Auth Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for auth API
authApi.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ Auth Response: ${response.status} ${response.config.url}`);
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (import.meta.env.DEV) {
        console.error(`❌ Auth Error ${status}:`, data);
      }

      return Promise.reject({
        status,
        message: data?.message || 'Authentication failed',
        data: data || null,
      });
    } else {
      console.error('🌐 Auth Network Error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error during authentication',
        data: null,
      });
    }
  }
);

// Response interceptor for main API
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (import.meta.env.DEV) {
        console.error(`❌ API Error ${status}:`, data);
      }

      if (status === 401) {
        console.warn('🔒 Authentication failed - redirecting to admin login');
        window.location.href = '/admin/login';
      }

      if (status === 403) {
        console.warn('🚫 Access forbidden - insufficient permissions');
      }

      if (status >= 500) {
        console.error('💥 Server error - please try again later');
      }

      return Promise.reject({
        status,
        message: data?.message || 'Request failed',
        data: data || null,
      });
    } else if (error.request) {
      console.error('🌐 Network Error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
        data: null,
      });
    } else {
      console.error('❓ Unknown Error:', error.message);
      return Promise.reject({
        status: -1,
        message: 'An unexpected error occurred',
        data: null,
      });
    }
  }
);

export { api, authApi };
export default api;