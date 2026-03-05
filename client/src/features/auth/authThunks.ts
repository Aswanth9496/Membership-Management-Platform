import { createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginCredentials, User, AuthResponse, RegisterAdminCredentials, RegisterMemberCredentials, RegisterResponse } from './types';
import * as authService from './services';

export const loginAdminUser = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: string }>(
    'auth/loginAdmin',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.loginAdmin(credentials);
            return data;
        } catch (err: any) {
            const data = err.response?.data;
            let errorMessage = data?.message || 'Login failed';

            if (data?.errors && Array.isArray(data.errors)) {
                errorMessage += ': ' + data.errors.join(' • ');
            }
            return rejectWithValue(errorMessage);
        }
    }
);

export const registerAdminUser = createAsyncThunk<RegisterResponse, RegisterAdminCredentials, { rejectValue: string }>(
    'auth/registerAdmin',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.registerAdmin(credentials);
            return data;
        } catch (err: any) {
            const data = err.response?.data;
            let errorMessage = data?.message || 'Registration failed';

            if (data?.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.join(' • ');
            }

            return rejectWithValue(errorMessage);
        }
    }
);

export const registerMemberUser = createAsyncThunk<RegisterResponse, RegisterMemberCredentials, { rejectValue: string }>(
    'auth/registerMember',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.registerMember(credentials);
            return data;
        } catch (err: any) {
            const data = err.response?.data;
            let errorMessage = data?.message || 'Registration failed';

            if (data?.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.join(' • ');
            }

            return rejectWithValue(errorMessage);
        }
    }
);

export const loginMemberUser = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: string }>(
    'auth/loginMember',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.loginMember(credentials);
            return data;
        } catch (err: any) {
            const data = err.response?.data;
            let errorMessage = data?.message || 'Login failed';

            if (data?.errors && Array.isArray(data.errors)) {
                errorMessage += ': ' + data.errors.join(' • ');
            }
            return rejectWithValue(errorMessage);
        }
    }
);

export const fetchProfile = createAsyncThunk<User, void, { rejectValue: string; state: any }>(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const data = await authService.fetchCurrentUser();
            return data.user;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to initialize session');
        }
    }
);

export const logoutUser = createAsyncThunk<void, void, { state: any }>(
    'auth/logoutUser',
    async (_, { getState }) => {
        const state = getState();
        const role = state.auth.user?.role;
        try {
            if (role === 'admin') {
                await authService.logoutAdmin();
            } else if (role === 'member') {
                await authService.logoutMember();
            }
        } catch (error) {
            console.error('Logout API failed - proceeding with local logout', error);
        }
    }
);
