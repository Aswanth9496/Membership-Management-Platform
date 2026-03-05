import React, { useState } from 'react';
import { User, Mail, Shield, Lock, ChevronDown, Phone, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { registerAdminUser } from '../../features/auth/authThunks';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        confirmPassword: '',
    });

    const validateForm = () => {
        if (!formData.fullName.trim()) return "Full name is required.";
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please provide a valid email address.";
        if (!/^[6-9]\d{9}$/.test(formData.phone)) return "Phone number must be a valid 10-digit number starting with 6-9.";
        if (!formData.role) return "Please select an admin role.";

        if (formData.password.length < 8) return "Password must be at least 8 characters long.";
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            return "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
        }

        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match.";
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (error) setError(null);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        const resultAction = await dispatch(registerAdminUser({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            password: formData.password
        }));

        setLoading(false);

        if (registerAdminUser.fulfilled.match(resultAction)) {
            navigate('/admin/login');
        } else {
            setError(resultAction.payload as string || 'Registration failed');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md my-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Create Admin Account</h1>
            <p className="text-sm text-slate-500 mb-6">Register a new team member with dashboard access.</p>

            {error && (
                <div className="mb-4 bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="fullName">
                        Full Name
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                        />
                    </div>
                </div>

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

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="phone">
                        Phone Number
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                        />
                    </div>
                </div>

                {/* Admin Role */}
                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="role">
                        Admin Role
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield size={18} className="text-slate-400" />
                        </div>
                        <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-slate-50/50"
                            required
                        >
                            <option value="" disabled hidden>Select Role</option>
                            <option value="president">President</option>
                            <option value="secretary">Secretary</option>
                            <option value="treasurer">Treasurer</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={18} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Passwords Flex Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="password">
                            Password
                        </label>
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
                    <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="confirmPassword">
                            Confirm
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Create Account'}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/admin/login" className="text-blue-600 font-bold hover:underline">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
