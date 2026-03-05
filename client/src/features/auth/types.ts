export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member' | 'president' | 'secretary' | 'treasurer';
    status?: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    status: AuthStatus;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface RegisterAdminCredentials {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password?: string;
}

export interface RegisterMemberCredentials {
    email: string;
    password?: string;
    membershipType: string;
    establishment: {
        name: string;
        tradeName: string;
        yearOfEstablishment: number;
        officialClassification: string;
        businessType: string;
        officialEmail: string;
        website?: string;
        gstRegistered: boolean;
        gstNumber?: string;
    };
    location: {
        district: string;
        region: string;
        city: string;
        pinCode: string;
        registeredAddress: string;
        communicationAddress?: string;
        isSameAddress: boolean;
    };
    member: {
        officeType: string;
        roleInAgency: string;
        fullName: string;
        dateOfBirth: string;
        mobile: string;
        landline?: string;
    };
    partner?: {
        name: string;
        mobile: string;
    };
    staff?: {
        name: string;
        mobile: string;
    };
    documents?: {
        agencyAddressProof?: { url: string; publicId?: string };
        shopPhoto?: { url: string; publicId?: string };
    };
    referredBy?: string;
}

export interface RegisterResponse {
    success: boolean;
    message?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ProfileResponse {
    success: boolean;
    user: User;
}
