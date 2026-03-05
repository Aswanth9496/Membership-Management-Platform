import api from '../../services/axios';
import type { LoginCredentials, AuthResponse, ProfileResponse, RegisterAdminCredentials, RegisterResponse } from './types';

export const loginAdmin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/admin/login', credentials);
    const { data, token } = response.data; // In case the server drops token natively at root OR inside data

    // Mapping backend response `{ success, data: { admin: { id, fullName... } } }` 
    // to match Redux `{ user: { id, name, email, role }, token }` 
    // *If token isn't natively bound, relies purely on HttpOnly
    const userPayload = data?.admin || data?.user || {};

    return {
        success: response.data.success,
        token: token || data?.token || 'httpOnly-placeholder',
        user: {
            id: userPayload.id || userPayload._id,
            name: userPayload.fullName || userPayload.name,
            email: userPayload.email,
            role: userPayload.role || 'admin'
        }
    };
};

export const loginMember = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/member/login', credentials);
    const { data, token } = response.data;

    // Mapping member response
    const userPayload = data?.member || data?.user || {};

    return {
        success: response.data.success,
        token: token || data?.token || 'httpOnly-placeholder',
        user: {
            id: userPayload.id || userPayload._id,
            name: userPayload.fullName || userPayload.name || 'Member User',
            email: userPayload.email,
            role: userPayload.role || 'member'
        }
    };
};

export const logoutAdmin = async (): Promise<void> => {
    await api.post('/api/admin/logout');
};

export const logoutMember = async (): Promise<void> => {
    await api.post('/api/member/logout');
};

export const getAdminProfile = async (): Promise<ProfileResponse> => {
    const response = await api.get('/api/admin/profile');
    const { data } = response.data;
    const userPayload = data?.admin || data?.user || {};

    return {
        success: response.data.success,
        user: {
            id: userPayload.id || userPayload._id,
            name: userPayload.fullName || userPayload.name,
            email: userPayload.email,
            role: userPayload.role || 'admin'
        }
    };
};

export const getMemberProfile = async (): Promise<ProfileResponse> => {
    const response = await api.get('/api/member/profile');
    const { data } = response.data;
    const userPayload = data?.member || data?.user || {};

    return {
        success: response.data.success,
        user: {
            id: userPayload.id || userPayload._id,
            name: userPayload.fullName || userPayload.name || 'Member User',
            email: userPayload.email,
            role: userPayload.role || 'member'
        }
    };
};

export const fetchCurrentUser = async (): Promise<ProfileResponse> => {
    const response = await api.get('/api/auth/me');
    const { data } = response.data;
    const userPayload = data?.user || {};

    return {
        success: response.data.success,
        user: {
            id: userPayload.id || userPayload._id,
            name: userPayload.fullName || userPayload.name || 'User',
            email: userPayload.email,
            role: userPayload.role
        }
    };
};

export const registerAdmin = async (credentials: RegisterAdminCredentials): Promise<RegisterResponse> => {
    const response = await api.post('/api/admin/register', credentials);
    return {
        success: response.data.success,
        message: response.data.message
    };
};

export const registerMember = async (credentials: any): Promise<RegisterResponse> => {
    const response = await api.post('/api/register', credentials);
    return {
        success: response.data.success,
        message: response.data.message
    };
};
