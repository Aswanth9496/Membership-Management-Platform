import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError } from '../../features/auth/authSlice';
import { loginAdminUser } from '../../features/auth/authThunks';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { status, error } = useAppSelector((state) => state.auth); const loading = status === 'loading';
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [localError, setLocalError] = useState<string | null>(null);

    const validateForm = () => {
        if (!formData.email.trim()) return "Email is required.";
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please provide a valid email address.";
        if (!formData.password) return "Password is required.";
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (error || localError) {
            dispatch(clearError());
            setLocalError(null);
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setLocalError(validationError);
            return;
        }

        // Dispatch the login thunk
        const resultAction = await dispatch(loginAdminUser(formData));

        if (loginAdminUser.fulfilled.match(resultAction)) {
            // Setup successful
            navigate('/admin/dashboard');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md my-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Admin Login</h1>
            <p className="text-sm text-slate-500 mb-6">Sign in to access your administrative dashboard.</p>

            {/* Error Message Box */}
            {(error || localError) && (
                <div className="mb-4 bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg font-medium">
                    {localError || error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="email">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="admin@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                        />
                    </div>
                </div>

                {/* Password Group */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-semibold text-slate-800" htmlFor="password">
                            Password
                        </label>
                        <Link to="#" className="text-sm text-blue-600 font-semibold hover:underline">
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
                    </button>
                </div>
            </form>


        </div>
    );
}
