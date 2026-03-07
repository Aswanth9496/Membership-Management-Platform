import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useAppSelector } from '../store/hooks';

export const AdminAuthLayout = () => {
    const { isAuthenticated, status } = useAppSelector((state) => state.auth);

    if (isAuthenticated && status !== 'loading') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
            {/* Header */}
            <header className="bg-white py-4 px-6 md:px-12 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center transform skew-x-[-10deg]"></div>
                    <span className="font-bold text-xl text-gray-900 font-sans tracking-tight">Admin Console</span>
                </div>
                <button className="bg-primary hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <HelpCircle size={16} />
                    <span>Support</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center p-4">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm font-medium text-slate-400">
                © 2024 Admin Panel. All rights reserved.
            </footer>
        </div>
    );
};
