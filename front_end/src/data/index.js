// Centralized API exports for production-ready architecture

// Admin endpoints
export { default as adminEndpoints } from './admin/admin_endpoints';

// Member endpoints  
export { default as memberEndpoints } from './member/user_endpoints';

// Base API instances (for direct usage if needed)
export { api, authApi } from './api';

// Named exports for better tree-shaking
export * from './admin/admin_endpoints';
export * from './member/user_endpoints';
