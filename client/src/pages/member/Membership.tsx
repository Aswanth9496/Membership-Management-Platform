import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import api from '../../services/api/axios';
import {
    User,
    Building2,
    MapPin,
    Edit3,
    X,
    Loader2,
    Clock,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Info
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MembershipDetails() {
    const { user } = useAppSelector((state: any) => state.auth);
    const [profile, setProfile] = useState<any>(null);
    const [changeStatus, setChangeStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [profileRes, statusRes] = await Promise.all([
                api.get('/api/member/profile'),
                api.get('/api/member/profile/change-status').catch(() => ({ data: { data: null } }))
            ]);
            setProfile(profileRes.data.data.member || profileRes.data.data.user);
            setChangeStatus(statusRes.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error', 'Could not load your profile details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleEditClick = () => {
        setFormData({
            'member.fullName': profile?.member?.fullName || '',
            'member.mobile': profile?.member?.mobile || '',
            'establishment.name': profile?.establishment?.name || profile?.establishment?.tradeName || '',
            'location.district': profile?.location?.district || '',
            'location.region': profile?.location?.region || '',
            'location.pincode': profile?.location?.pincode || '',
        });
        setEditing(true);
    };

    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            const requestedChanges: any = {
                member: {
                    fullName: formData['member.fullName'],
                    mobile: formData['member.mobile']
                },
                establishment: {
                    name: formData['establishment.name']
                },
                location: {
                    district: formData['location.district'],
                    region: formData['location.region'],
                    pincode: formData['location.pincode']
                }
            };

            await api.post('/api/member/profile/request-update', { requestedChanges });

            Swal.fire('Request Submitted', 'Your profile update request is pending admin approval.', 'success');
            setEditing(false);
            fetchAllData();
        } catch (error: any) {
            Swal.fire('Update Failed', error.response?.data?.message || 'No actual changes detected.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        try {
            const result = await Swal.fire({
                title: 'Cancel Request?',
                text: "Are you sure you want to cancel your pending update request?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Yes, cancel it'
            });

            if (result.isConfirmed) {
                setLoading(true);
                await api.delete('/api/member/profile/cancel-request');
                Swal.fire('Cancelled', 'Your update request has been cancelled.', 'success');
                fetchAllData();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to cancel request.', 'error');
            setLoading(false);
        }
    };

    if (loading && !profile) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    const { establishment, member, location, email } = profile || {};

    const hasPendingRequest = changeStatus?.hasPendingRequest;
    const lastRequestStatus = changeStatus?.lastRequest?.status;
    const isRejected = !hasPendingRequest && lastRequestStatus === 'rejected';

    let StatusIcon = Info;
    let statusText = 'No Pending Update Requests';
    let statusBg = 'bg-slate-50 border-slate-200';
    let iconColor = 'text-slate-400';

    if (hasPendingRequest) {
        StatusIcon = Clock;
        statusText = 'Profile Update Pending Admin Approval';
        statusBg = 'bg-blue-50 border-blue-100';
        iconColor = 'text-blue-500';
    } else if (isRejected) {
        StatusIcon = AlertCircle;
        statusText = 'Profile Update Rejected';
        statusBg = 'bg-rose-50 border-rose-100';
        iconColor = 'text-rose-500';
    } else if (lastRequestStatus === 'approved') {
        StatusIcon = CheckCircle2;
        statusText = 'Profile Successfully Updated';
        statusBg = 'bg-[#E8F8EE] border-emerald-100';
        iconColor = 'text-[#05A660]';
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-sans text-slate-900 pb-10">
            {/* Update Pending Banner */}
            {hasPendingRequest && (
                <div className="mt-4 mb-8 bg-blue-50 border border-blue-200 rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm border border-blue-100">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-blue-900 text-lg tracking-tight">Update Pending Approval</h3>
                            <p className="text-blue-700 text-[13px] font-semibold mt-0.5">Your requested profile changes are currently being reviewed by an admin.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                        <button
                            onClick={handleCancelRequest}
                            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            Cancel Request
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Banner */}
            {isRejected && (
                <div className="mt-4 mb-8 bg-rose-50 border border-rose-200 rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl text-rose-500 shadow-sm border border-rose-100">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-rose-900 text-lg tracking-tight">Update Rejected</h3>
                            <p className="text-rose-700 text-[13px] font-semibold mt-0.5">
                                Reason: {changeStatus?.lastRequest?.rejectionReason || 'Please contact support for more information.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleEditClick} className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-rose-200">
                        Submit New Request
                    </button>
                </div>
            )}

            {/* Dashboard aligned Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <p className="text-[11px] font-bold text-blue-600 tracking-[0.15em] uppercase mb-2">My Information</p>
                    <h1 className="text-[32px] sm:text-[40px] leading-none font-extrabold tracking-tight text-slate-900">
                        Profile Details
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleEditClick}
                        disabled={hasPendingRequest}
                        className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white border border-transparent disabled:border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-2 shadow-sm font-bold text-[13px] transition-all"
                    >
                        <Edit3 size={16} />
                        Edit Profile
                    </button>

                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${statusBg}`}>
                            <StatusIcon className={iconColor} size={StatusIcon === CheckCircle2 ? 20 : 18} fill={StatusIcon === CheckCircle2 ? "currentColor" : "none"} stroke={StatusIcon === CheckCircle2 ? "white" : "currentColor"} strokeWidth={StatusIcon === CheckCircle2 ? 1 : 2} />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Update Status</p>
                            <p className="text-[14px] font-bold text-slate-900 leading-none mt-1">{statusText}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Primary Member */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-[#eff6ff] border border-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm shrink-0">
                            <User size={18} />
                        </div>
                        <h3 className="font-extrabold text-[16px] text-[#0B1221]">Primary Member</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Full Name</p>
                            <p className="text-[15px] text-slate-800 font-bold">{member?.fullName || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Email Address</p>
                            <p className="text-[15px] text-slate-800 font-bold truncate" title={email}>{email || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Mobile Number</p>
                            <p className="text-[15px] text-slate-800 font-bold">{member?.mobile || 'Not recorded'}</p>
                        </div>
                    </div>
                </div>

                {/* Establishment Location */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-[#ecfdf5] border border-emerald-100 p-2.5 rounded-xl text-emerald-600 shadow-sm shrink-0">
                            <MapPin size={18} />
                        </div>
                        <h3 className="font-extrabold text-[16px] text-[#0B1221]">Registered Location</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> District</p>
                            <p className="text-[15px] text-slate-800 font-bold">{location?.district || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Region</p>
                            <p className="text-[15px] text-slate-800 font-bold">{location?.region || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Pincode</p>
                            <p className="text-[15px] text-slate-800 font-bold">{location?.pincode || 'Not recorded'}</p>
                        </div>
                    </div>
                </div>

                {/* Statutory Details */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 hover:shadow-md transition-shadow lg:col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-[#f5f3ff] border border-purple-100 p-2.5 rounded-xl text-purple-600 shadow-sm shrink-0">
                            <Building2 size={18} />
                        </div>
                        <h3 className="font-extrabold text-[16px] text-[#0B1221]">Establishment Data</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Trade / Establishment Name</p>
                            <p className="text-[15px] text-slate-800 font-bold">{establishment?.tradeName || establishment?.name || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Organization Type</p>
                            <p className="text-[15px] text-slate-800 font-bold">{establishment?.officialClassification || 'Not recorded'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> GST Registered</p>
                            <div className="text-[15px] text-slate-800 font-bold flex flex-wrap items-center gap-2">
                                {establishment?.gstRegistered ? 'Yes' : 'No'}
                                {establishment?.gstNumber && (
                                    <span className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-500 border border-slate-200">
                                        {establishment.gstNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Request Profile Update</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Submit corrections to your registered profile data.</p>
                            </div>
                            <button onClick={() => setEditing(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitUpdate} className="p-6 overflow-y-auto flex-1">

                            <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">Primary Member Data</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input type="text" value={formData['member.fullName']} onChange={e => setFormData({ ...formData, 'member.fullName': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mobile Number</label>
                                    <input type="text" value={formData['member.mobile']} onChange={e => setFormData({ ...formData, 'member.mobile': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                                </div>
                            </div>

                            <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4 border-t border-slate-100 pt-8">Establishment Data</h4>
                            <div className="mb-8">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Trade / Establishment Name</label>
                                <input type="text" value={formData['establishment.name']} onChange={e => setFormData({ ...formData, 'establishment.name': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                            </div>

                            <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4 border-t border-slate-100 pt-8">Location details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">District</label>
                                    <input type="text" value={formData['location.district']} onChange={e => setFormData({ ...formData, 'location.district': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Region</label>
                                    <input type="text" value={formData['location.region']} onChange={e => setFormData({ ...formData, 'location.region': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                                </div>
                                <div className="sm:col-span-2 md:col-span-1">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pincode</label>
                                    <input type="text" value={formData['location.pincode']} onChange={e => setFormData({ ...formData, 'location.pincode': e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
                                </div>
                            </div>

                            <div className="mt-10 flex gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center shadow-sm shadow-blue-200 transition-all">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Update Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
