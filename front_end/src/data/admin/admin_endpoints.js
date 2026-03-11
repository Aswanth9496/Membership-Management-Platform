import { authApi, api } from '../api';

// Admin Authentication & Profile Endpoints
export const adminEndpoints = {
  // 🔐 Authentication Routes (use authApi - no credentials initially)
  auth: {
    register: (adminData) => authApi.post('/api/admin/register', adminData),
    login: (credentials) => authApi.post('/api/admin/login', credentials),
    forgotPassword: (email) => authApi.post('/api/admin/forgot-password', { email }),
    verifyOTP: (email, otp) => authApi.post('/api/admin/verify-otp', { email, otp }),
    resetPassword: (resetData) => authApi.post('/api/admin/reset-password', resetData),
  },

  // 👤 Profile Management Routes (use api - with credentials)
  profile: {
    logout: () => api.post('/api/admin/logout'),
    getProfile: () => api.get('/api/admin/profile'),
    getDashboard: () => api.get('/api/admin/dashboard'),
  },

  // 👥 Member Management Routes (use api - with credentials)
  members: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.role) params.append('role', filters.role);
      
      const queryString = params.toString();
      const url = queryString ? `/api/admin/members?${queryString}` : '/api/admin/members';
      
      return api.get(url);
    },
    updateStatus: (memberId, statusData) => api.put(`/api/admin/members/${memberId}/status`, statusData),
    getPendingApprovals: () => api.get('/api/admin/pending-approvals'),
    getPendingApprovalsByRole: (role) => api.get(`/api/admin/pending-approvals/${role}`),
    updateApproval: (memberId, approvalData) => api.put(`/api/admin/members/${memberId}/approval`, approvalData),
    toggleBlockStatus: (memberId, data) => api.put(`/api/admin/members/${memberId}/block`, data),
    deleteMember: (memberId) => api.delete(`/api/admin/members/${memberId}`),
  },

  // 🔄 Profile Update Requests (use api - with credentials)
  profileUpdates: {
    getAll: () => api.get('/api/admin/profile-updates'),
    reviewRequest: (requestId, reviewData) => api.put(`/api/admin/profile-updates/${requestId}/review`, reviewData),
  },

  // 💰 Payments (use api - with credentials)
  payments: {
    getAll: () => api.get('/api/admin/payments'),
  },

  // 📅 Event Management Routes (use api - with credentials)
  events: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = queryString ? `/api/admin/events?${queryString}` : '/api/admin/events';
      return api.get(url);
    },
    getById: (id) => api.get(`/api/admin/events/${id}`),
    create: (eventData) => api.post('/api/admin/events', eventData),
    update: (id, eventData) => api.patch(`/api/admin/events/${id}`, eventData),
    delete: (id) => api.delete(`/api/admin/events/${id}`),
    getRegistrations: (eventId) => api.get(`/api/admin/events/${eventId}/registrations`),
  },
};

export default adminEndpoints;