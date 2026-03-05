import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';

// Create the axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let store: Store;

// Inject store to avoid circular dependency
export const injectStore = (_store: Store) => {
    store = _store;
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from Redux state (if store is injected) or localStorage fallback
        const state = store?.getState();
        const token = state?.auth?.token || localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: any[] = [];
let isLoggingOut = false;

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for login/register API routes so errors propogate directly to components
        if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register')) {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            if (isLoggingOut) return Promise.reject(error);

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Determine if they are member or admin, ideally there's just one unifying /api/auth/refresh
                // This will fail with a 401 if they don't have a valid active refresh cookie which triggers standard logout
                const refreshPath = window.location.pathname.includes('/admin') ? '/api/admin/refresh-token' : '/api/member/refresh-token';

                // Example request, needs actual implementation based on your server structure. Check if the server replies with a token.
                const response = await axios.post(import.meta.env.VITE_API_URL + refreshPath, {}, { withCredentials: true });
                const { token } = response.data;

                // Success: store new token and process queued requests
                localStorage.setItem('token', token);
                api.defaults.headers.common.Authorization = `Bearer ${token}`;
                originalRequest.headers.Authorization = `Bearer ${token}`; // Fix original request before retrying

                processQueue(null, token);

                // Dispatch to update state and synchronize
                if (store) store.dispatch({ type: 'auth/refreshToken', payload: token });

                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);

                // If it fails, truly force log them out safely
                if (store && !isLoggingOut) {
                    isLoggingOut = true;
                    store.dispatch({ type: 'auth/logout' });

                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/admin')) {
                        window.location.href = '/admin/login';
                    } else {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(err);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
