import { authApi, api } from '../api';

// Member Authentication & Profile Endpoints
export const memberEndpoints = {
  // 🔐 Authentication Routes (use authApi - no credentials initially)
  auth: {
    login: (credentials) => authApi.post('/api/member/login', credentials),
    forgotPassword: (email) => authApi.post('/api/member/forgot-password', { email }),
    verifyOTP: (email, otp) => authApi.post('/api/member/verify-otp', { email, otp }),
    resetPassword: (resetData) => authApi.post('/api/member/reset-password', resetData),
  },

  // 👤 Profile Management Routes (use api - with credentials)
  profile: {
    logout: () => api.post('/api/member/logout'),
    getProfile: () => api.get('/api/member/profile'),
  },

  // 📝 Registration Routes (use authApi - no credentials initially)
  registration: {
    register: (memberData) => authApi.post('/api/register', memberData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getApprovedMembers: (search = '') => authApi.get(`/api/register/members?search=${search}`),
    uploadDocument: (formData) => authApi.post('/api/register/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // 🔄 Profile Update Management (use api - with credentials)
  profileUpdates: {
    requestUpdate: (updateData) => api.post('/api/member/profile/request-update', updateData),
    getStatus: () => api.get('/api/member/profile/change-status'),
    cancelRequest: () => api.delete('/api/member/profile/cancel-request'),
    downloadCertificate: () => api.get('/api/member/profile/certificate/download'),
    uploadMissingDocument: (formData) => api.post('/api/member/profile/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // 🎉 Event Management (use api - with credentials)
  events: {
    getAll: () => api.get('/api/member/events'),
    getMyEvents: () => api.get('/api/member/events/my-events'),
    verifyPayment: (paymentData) => api.post('/api/member/events/verify-payment', paymentData),
    getDetails: (eventId) => api.get(`/api/member/events/${eventId}`),
    register: (eventId) => api.post(`/api/member/events/register/${eventId}`),
  },

  // 💳 Payment Endpoints
  payments: {
    getStatus: () => api.get('/api/payment/status'),
    createOrder: () => api.post('/api/payment/create-order'),
    verifyPayment: (paymentData) => api.post('/api/payment/verify', paymentData),
    dummySuccess: () => api.post('/api/payment/dummy-success'),
    getTransactions: () => api.get('/api/payment/transactions'),
  },

  // 📝 Reference Verification (use api - with credentials)
  references: {
    getMyRequests: () => api.get('/api/references/my-requests'),
    confirm: (requestId, remarks) => api.patch(`/api/references/${requestId}/confirm`, { remarks }),
    reject: (requestId, remarks) => api.patch(`/api/references/${requestId}/reject`, { remarks }),
  },
};

export default memberEndpoints;