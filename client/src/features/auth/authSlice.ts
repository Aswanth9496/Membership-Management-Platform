import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthResponse, User } from './types';
import { loginAdminUser, loginMemberUser, fetchProfile, logoutUser } from './authThunks';

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    status: localStorage.getItem('token') ? 'loading' : 'idle',
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.status = 'idle';
            state.error = null;
            localStorage.removeItem('token');
        },
        clearError: (state) => {
            state.error = null;
        },
        refreshToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            // Admin Login
            .addCase(loginAdminUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginAdminUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.status = 'authenticated';
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginAdminUser.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.payload || 'Login failed';
            })
            // Member Login
            .addCase(loginMemberUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginMemberUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.status = 'authenticated';
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginMemberUser.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.payload || 'Login failed';
            })
            // Fetch Profile
            .addCase(fetchProfile.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'authenticated';
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchProfile.rejected, (state) => {
                state.status = 'error';
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })
            // Logout User API Trigger
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.status = 'idle';
                state.error = null;
                localStorage.removeItem('token');
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
