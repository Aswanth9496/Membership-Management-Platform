import React, { useEffect, useState } from 'react';
import api from '../../services/api/axios';
import { useAppSelector } from '../../store/hooks';
import {
    User,
    Building2,
    MapPin,
    Mail,
    Phone,
    Calendar,
    Badge,
    CreditCard,
    Briefcase,
    Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Profile() {
    const { user } = useAppSelector((state: any) => state.auth);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/member/profile');
                setProfile(response.data.data.member || response.data.data.user);
            } catch (error) {
                console.error('Failed to fetch profile', error);
                Swal.fire('Error', 'Could not load profile data.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center text-slate-500">
                Failed to load profile. Please refresh.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Agency Profile</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your agency's verified information and internal records.</p>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Identity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Building2 size={120} />
                    </div>

                    <div className="w-24 h-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-3xl uppercase shrink-0 border border-blue-100">
                        {profile?.establishment?.name?.charAt(0) || 'A'}
                    </div>

                    <div className="flex flex-col flex-1 justify-center z-10">
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                {profile?.establishment?.name || 'Loading...'}
                            </h2>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {profile?.establishment?.businessType}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                            <Briefcase size={14} /> Trade Name: {profile?.establishment?.tradeName}
                        </p>

                        <div className="mt-4 flex flex-col sm:flex-row gap-4 text-sm font-medium">
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail size={16} className="text-slate-400" /> {profile?.establishment?.officialEmail}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Phone size={16} className="text-slate-400" /> {profile?.member?.mobile}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Membership Block */}
                <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-blue-400">
                        <Badge size={100} />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Membership No.</div>
                        <div className="text-xl font-black text-white tracking-tight">
                            {profile?.membershipNumber || 'Pending Issuance'}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {profile?.derivedStatus || profile?.status || 'Processing'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Location Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-500" /> Establishment Location
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Registered Address</div>
                            <div className="text-sm font-medium text-slate-700 leading-relaxed">
                                {profile?.location?.registeredAddress},<br />
                                {profile?.location?.city}, {profile?.location?.district}<br />
                                {profile?.location?.region} — {profile?.location?.pinCode}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Authorized Representative Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <User size={18} className="text-blue-500" /> Primary Member
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 relative">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
                            <span className="text-sm font-semibold text-slate-900">{profile?.member?.fullName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</span>
                            <span className="text-sm font-semibold text-slate-900">{profile?.member?.roleInAgency}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</span>
                            <span className="text-sm font-semibold text-slate-900">{profile?.member?.mobile}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {profile?.member?.dateOfBirth ? new Date(profile.member.dateOfBirth).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statutory Registration Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-blue-500" /> Statutory Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organization Type</span>
                            <span className="text-sm font-semibold text-slate-900">{profile?.establishment?.officialClassification}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Year</span>
                            <span className="text-sm font-semibold text-slate-900">{profile?.establishment?.yearOfEstablishment}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Registered</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {profile?.establishment?.gstRegistered ? 'Yes' : 'No'}
                            </span>
                        </div>
                        {profile?.establishment?.gstRegistered && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Number</span>
                                <span className="text-sm font-black text-slate-900">{profile?.establishment?.gstNumber}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Message */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
                <div className="text-blue-600 mt-0.5"><Badge size={16} /></div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Need to update your profile?</h4>
                    <p className="text-xs text-blue-700 mt-1 max-w-2xl leading-relaxed">
                        To maintain verified integrity, critical agency information cannot be directly edited after registration.
                        If your details have changed, please contact the administrative secretariat for a formal update request.
                    </p>
                </div>
            </div>

        </div>
    );
}
