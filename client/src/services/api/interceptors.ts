import type { Store } from '@reduxjs/toolkit';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

let store: Store;

// Inject store to avoid circular dependency
export const injectStore = (_store: Store) => {
    store = _store;
};

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

export const setupInterceptors = (api: AxiosInstance) => {
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
                return Promise.reject(error);
            }

            return Promise.reject(error);
        }
    );
};
