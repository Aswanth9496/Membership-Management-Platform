import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

// Protected Route Wrapper
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Layouts
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminAuthLayout } from '../layouts/AdminAuthLayout';
import { MemberLayout } from '../layouts/MemberLayout';
import { MemberAuthLayout } from '../layouts/MemberAuthLayout';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminMembers from '../pages/admin/Members';
import AdminApprovals from '../pages/admin/Approvals';
import AdminEvents from '../pages/admin/Events';
import AdminRejectedUsers from '../pages/admin/RejectedUsers';
import AdminLogin from '../pages/admin/Login';
import AdminRegister from '../pages/admin/Register';

// Member Pages
import MemberLogin from '../pages/member/Login';
import MemberRegister from '../pages/member/Register';
import MemberDashboard from '../pages/member/Dashboard';
import MemberMembership from '../pages/member/Membership';
import MemberCertificate from '../pages/member/Certificate';
import MemberEvents from '../pages/member/Events';
import MemberProfile from '../pages/member/Profile';
import MemberPayments from '../pages/member/Payments';


export const Routes = () => {
  const { isAuthenticated, status, user } = useAppSelector((state) => state.auth);

  // Show full-screen loader only for initial auth check (has token, checking valid user)
  const isInitializing = status === 'loading' && isAuthenticated && !user;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <p className="text-slate-900 font-bold tracking-tight">Syncing Access</p>
            <p className="text-xs text-slate-500 font-medium">Validating your administrative footprint...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Root Redirection Logic - Role Aware */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? user?.role === 'member'
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* 
                  USER ACCESS CONTROL PLAN (Closed System)
                  Public Layout used only for: /login, /register
                */}
        <Route element={<MemberAuthLayout />}>
          <Route path="/login" element={<MemberLogin />} />
          <Route path="/register" element={<MemberRegister />} />
        </Route>

        {/* Member Protected Routes (Main App Layout) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["member"]}>
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<MemberDashboard />} />
          <Route path="/membership" element={<MemberMembership />} />
          <Route path="/certificate" element={<MemberCertificate />} />
          <Route path="/events" element={<MemberEvents />} />
          <Route path="/profile" element={<MemberProfile />} />
          <Route path="/payments" element={<MemberPayments />} />
        </Route>

        {/* --- ADMIN SECTION --- */}
        {/* Admin Auth Routes */}
        <Route element={<AdminAuthLayout />}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
        </Route>

        {/* Admin Routes with Layout and Protection */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "president", "secretary", "treasurer"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="pending" element={<AdminApprovals />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="rejected-users" element={<AdminRejectedUsers />} />
        </Route>

        {/* Catch-all route to handle 404s */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </RouterRoutes>
    </BrowserRouter>
  );
};
