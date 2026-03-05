import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
    allowedRoles?: ('admin' | 'member' | 'president' | 'secretary' | 'treasurer' | 'super_admin')[];
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const { isAuthenticated, status, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    if (status === 'loading') {
        // Optionally display a spinner here while profile is fetching on reload
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const rawToken = localStorage.getItem('token');
    const hasValidToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken !== '';

    // If not authenticated (and token not resolving), redirect to either member or admin login
    if (!isAuthenticated && !hasValidToken) {
        const isAttemptingAdmin = location.pathname.startsWith('/admin');
        return <Navigate to={isAttemptingAdmin ? "/admin/login" : "/login"} replace />;
    }

    // If Roles are specified, ensure user has properly mapped active role (must wait till user is truthy if page reload)
    if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
