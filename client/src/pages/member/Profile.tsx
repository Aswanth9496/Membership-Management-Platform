import React, { useEffect, useState } from 'react';
import api from '../../services/api/axios';
import { useAppSelector } from '../../store/hooks';
import {
    User as UserIcon, Building2, MapPin, Mail, Phone, Calendar as CalendarIcon,
    Badge, CreditCard, Briefcase, Loader2, Edit3, Save, X, Clock, Trash2, CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Profile() {
    const { user } = useAppSelector((state: any) => state.auth);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [pendingRequest, setPendingRequest] = useState<any>(null);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const [profileRes, statusRes] = await Promise.all([
                api.get('/api/member/profile'),
                api.get('/api/member/profile/change-status')
            ]);

            setProfile(profileRes.data.data.member || profileRes.data.data.user);

            if (statusRes.data.data?.hasPendingRequest) {
                setPendingRequest(statusRes.data.data.request);
            } else {
                setPendingRequest(null);
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
            Swal.fire('Error', 'Could not load profile data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleEditChange = (path: string, value: string) => {
        const keys = path.split('.');
        setEditData((prev: any) => {
            const newData = JSON.parse(JSON.stringify(prev));
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const startEditing = () => {
        setEditData({
            member: {
                fullName: profile.member?.fullName || '',
                roleInAgency: profile.member?.roleInAgency || '',
                mobile: profile.member?.mobile || '',
            },
            establishment: {
                name: profile.establishment?.name || '',
                tradeName: profile.establishment?.tradeName || '',
                businessType: profile.establishment?.businessType || '',
                officialEmail: profile.establishment?.officialEmail || '',
                officialClassification: profile.establishment?.officialClassification || '',
                yearOfEstablishment: profile.establishment?.yearOfEstablishment || '',
            },
            location: {
                registeredAddress: profile.location?.registeredAddress || '',
                city: profile.location?.city || '',
                district: profile.location?.district || '',
                region: profile.location?.region || '',
                pinCode: profile.location?.pinCode || '',
            }
        });
        setIsEditing(true);
    };

    const submitUpdate = async () => {
        try {
            // Helper to clean up unmodified fields vs original profile
            const normalize = (val: any) => val || '';
            const finalRequestedChanges: any = {};
            let hasChanges = false;

            const compareAndAdd = (section: string, key: string) => {
                if (normalize(editData[section]?.[key]) !== normalize(profile[section]?.[key])) {
                    if (!finalRequestedChanges[section]) finalRequestedChanges[section] = {};
                    finalRequestedChanges[section][key] = editData[section][key];
                    hasChanges = true;
                }
            };

            compareAndAdd('member', 'fullName');
            compareAndAdd('member', 'roleInAgency');
            compareAndAdd('member', 'mobile');

            compareAndAdd('establishment', 'name');
            compareAndAdd('establishment', 'tradeName');
            compareAndAdd('establishment', 'businessType');
            compareAndAdd('establishment', 'officialEmail');
            compareAndAdd('establishment', 'officialClassification');
            compareAndAdd('establishment', 'yearOfEstablishment');

            compareAndAdd('location', 'registeredAddress');
            compareAndAdd('location', 'city');
            compareAndAdd('location', 'district');
            compareAndAdd('location', 'region');
            compareAndAdd('location', 'pinCode');

            if (!hasChanges) {
                Swal.fire('No Changes', 'You haven\'t made any changes to your profile.', 'info');
                return;
            }

            Swal.fire({
                title: 'Submitting',
                text: 'Creating profile update request...',
                didOpen: () => Swal.showLoading()
            });

            await api.post('/api/member/profile/request-update', {
                requestedChanges: finalRequestedChanges
            });

            Swal.fire('Success', 'Profile update request submitted for admin approval.', 'success');
            setIsEditing(false);
            fetchProfileData();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to submit request', 'error');
        }
    };

    const cancelPendingRequest = async () => {
        try {
            const confirmed = await Swal.fire({
                title: 'Cancel Request?',
                text: 'Are you sure you want to withdraw your pending profile update?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, cancel it!'
            });

            if (confirmed.isConfirmed) {
                await api.delete('/api/member/profile/cancel-request');
                Swal.fire('Cancelled', 'Your request has been removed.', 'success');
                fetchProfileData();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to cancel', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-slate-500" size={32} />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center text-slate-500">Failed to load profile. Please refresh.</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Agency Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your agency's verified information and internal records.</p>
                </div>
                {!pendingRequest && !isEditing && (
                    <button onClick={startEditing} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm">
                        <Edit3 size={16} /> Edit Profile
                    </button>
                )}
                {isEditing && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditing(false)} className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm">
                            <X size={16} /> Cancel
                        </button>
                        <button onClick={submitUpdate} className="bg-primary text-white hover:bg-slate-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm ring-1 ring-slate-700/50">
                            <Save size={16} /> Submit Update
                        </button>
                    </div>
                )}
            </div>

            {pendingRequest && !isEditing && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-amber-900">Update Request Pending</h4>
                        <p className="text-sm text-amber-700 mt-1 font-medium">
                            You have submitted profile changes which are currently waiting for administrator approval. Pending for {pendingRequest.pendingFor}.
                        </p>
                    </div>
                    <button onClick={cancelPendingRequest} className="bg-white text-rose-500 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0">
                        <Trash2 size={14} /> Cancel Request
                    </button>
                </div>
            )}

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Identity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Building2 size={120} />
                    </div>

                    <div className="w-24 h-24 rounded-3xl bg-slate-50 text-primary flex items-center justify-center font-bold text-3xl uppercase shrink-0 border border-slate-100">
                        {profile?.establishment?.name?.charAt(0) || 'A'}
                    </div>

                    <div className="flex flex-col flex-1 justify-center z-10">
                        <div className="flex items-center gap-2 mb-1.5">
                            {isEditing ? (
                                <input type="text" value={editData.establishment?.name} onChange={(e) => handleEditChange('establishment.name', e.target.value)} className="text-xl font-bold text-slate-900 w-full border-b border-slate-300 focus:border-slate-500 focus:outline-none bg-transparent" placeholder="Establishment Name" />
                            ) : (
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                    {profile?.establishment?.name || 'Loading...'}
                                </h2>
                            )}

                            {!isEditing && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                                    {profile?.establishment?.businessType}
                                </span>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-1.5 mt-2">
                                <Briefcase size={14} className="text-slate-400 shrink-0" />
                                <input type="text" value={editData.establishment?.tradeName} onChange={(e) => handleEditChange('establishment.tradeName', e.target.value)} className="text-sm font-medium text-slate-900 w-full border-b border-slate-300 focus:border-slate-500 focus:outline-none bg-transparent" placeholder="Trade Name" />
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                <Briefcase size={14} /> Trade Name: {profile?.establishment?.tradeName}
                            </p>
                        )}

                        <div className="mt-4 flex flex-col sm:flex-row gap-4 text-sm font-medium">
                            <div className="flex items-center gap-1.5 text-slate-600 flex-1">
                                <Mail size={16} className="text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input type="email" value={editData.establishment?.officialEmail} onChange={(e) => handleEditChange('establishment.officialEmail', e.target.value)} className="w-full border-b border-slate-300 focus:border-slate-500 focus:outline-none bg-transparent" />
                                ) : (
                                    <span>{profile?.establishment?.officialEmail}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 flex-1">
                                <Phone size={16} className="text-slate-400 shrink-0" />
                                {isEditing ? (
                                    <input type="text" value={editData.member?.mobile} onChange={(e) => handleEditChange('member.mobile', e.target.value)} className="w-full border-b border-slate-300 focus:border-slate-500 focus:outline-none bg-transparent" />
                                ) : (
                                    <span>{profile?.member?.mobile}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Membership Block */}
                <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-slate-400">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-slate-500/20 text-slate-400 border border-slate-500/30">
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
                        <MapPin size={18} className="text-slate-500" /> Establishment Location
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Registered Address</div>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input type="text" value={editData.location?.registeredAddress} onChange={e => handleEditChange('location.registeredAddress', e.target.value)} placeholder="Full Address..." className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-1000 outline-none" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={editData.location?.city} onChange={e => handleEditChange('location.city', e.target.value)} placeholder="City" className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-1000 outline-none" />
                                        <input type="text" value={editData.location?.district} onChange={e => handleEditChange('location.district', e.target.value)} placeholder="District" className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-1000 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={editData.location?.region} onChange={e => handleEditChange('location.region', e.target.value)} placeholder="Region/State" className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-1000 outline-none" />
                                        <input type="text" value={editData.location?.pinCode} onChange={e => handleEditChange('location.pinCode', e.target.value)} placeholder="PIN / ZIP" className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-1000 outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm font-medium text-slate-700 leading-relaxed">
                                    {profile?.location?.registeredAddress},<br />
                                    {profile?.location?.city}, {profile?.location?.district}<br />
                                    {profile?.location?.region} — {profile?.location?.pinCode}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Authorized Representative Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <UserIcon size={18} className="text-slate-500" /> Primary Member
                    </h3>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0 relative gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
                            {isEditing ? (
                                <input type="text" value={editData.member?.fullName} onChange={e => handleEditChange('member.fullName', e.target.value)} className="text-sm font-semibold text-slate-900 border-b border-slate-300 focus:border-slate-500 outline-none sm:text-right" />
                            ) : (
                                <span className="text-sm font-semibold text-slate-900">{profile?.member?.fullName}</span>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0 gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</span>
                            {isEditing ? (
                                <input type="text" value={editData.member?.roleInAgency} onChange={e => handleEditChange('member.roleInAgency', e.target.value)} className="text-sm font-semibold text-slate-900 border-b border-slate-300 focus:border-slate-500 outline-none sm:text-right" />
                            ) : (
                                <span className="text-sm font-semibold text-slate-900">{profile?.member?.roleInAgency}</span>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0 gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {profile?.member?.dateOfBirth ? new Date(profile.member.dateOfBirth).toLocaleDateString() : 'N/A'} <span className="text-[10px] text-slate-400 font-normal ml-1">(Non-editable)</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statutory Registration Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-slate-500" /> Statutory Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization Type</div>
                            {isEditing ? (
                                <input type="text" value={editData.establishment?.officialClassification} onChange={e => handleEditChange('establishment.officialClassification', e.target.value)} className="text-sm font-semibold text-slate-900 bg-transparent border-b border-slate-300 focus:border-slate-500 outline-none w-full" />
                            ) : (
                                <div className="text-sm font-semibold text-slate-900 truncate">{profile?.establishment?.officialClassification}</div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Year</div>
                            {isEditing ? (
                                <input type="number" value={editData.establishment?.yearOfEstablishment} onChange={e => handleEditChange('establishment.yearOfEstablishment', e.target.value)} className="text-sm font-semibold text-slate-900 bg-transparent border-b border-slate-300 focus:border-slate-500 outline-none w-full" />
                            ) : (
                                <div className="text-sm font-semibold text-slate-900">{profile?.establishment?.yearOfEstablishment}</div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</div>
                            {isEditing ? (
                                <input type="text" value={editData.establishment?.businessType} onChange={e => handleEditChange('establishment.businessType', e.target.value)} className="text-sm font-semibold text-slate-900 bg-transparent border-b border-slate-300 focus:border-slate-500 outline-none w-full" />
                            ) : (
                                <div className="text-sm font-semibold text-slate-900">{profile?.establishment?.businessType || 'N/A'}</div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Number</div>
                            <div className="text-sm font-black text-slate-900">{profile?.establishment?.gstRegistered ? profile?.establishment?.gstNumber : 'Unregistered'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Message */}
            {!isEditing && !pendingRequest && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 text-slate-600 mt-1">
                        <UserIcon size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Keeping your profile updated</h4>
                        <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                            If any of your critical agency information changes, click "Edit Profile" above. Any modifications requested will be sent to the administration team for approval before officially updating your database records.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
