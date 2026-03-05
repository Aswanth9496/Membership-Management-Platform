import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import api from '../../services/api/axios';
import MySwal from '../../utils/swal';
import {
    Building2,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Eye,
    ShieldCheck,
    Search,
    User,
    Filter,
    Check,
    X,
    CreditCard,
    FileText,
    ExternalLink,
    Download,
    Calendar,
    Briefcase,
    Hash
} from 'lucide-react';

interface ApprovalLog {
    role: string;
    action: 'approved' | 'rejected';
    reason?: string;
    timestamp: string;
}

interface AgencyApproval {
    id: string;
    agencyName: string;
    tradeName: string;
    licenseNumber?: string;
    gstNumber?: string;
    city: string;
    district: string;
    email: string;
    contactPerson: string;
    phone: string;
    membershipType: 'new' | 'renewal';
    submittedAt: string;
    approvals: {
        president: 'pending' | 'approved' | 'rejected';
        secretary: 'pending' | 'approved' | 'rejected';
        treasurer: 'pending' | 'approved' | 'rejected';
    };
    approvalLog?: ApprovalLog[];
    documents?: {
        agencyAddressProof?: string;
        shopPhoto?: string;
        businessCard?: string;
    };
    establishment?: any;
    location?: any;
}

type ApprovalStatus = 'Pending' | 'Partially Approved' | 'Fully Approved' | 'Rejected';

const mockPendingAgencies: AgencyApproval[] = []; // Empty mock data to prefer real ones

export default function Approvals() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [agencies, setAgencies] = useState<AgencyApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Multi-role Verification State
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState<AgencyApproval | null>(null);
    const [rejectionTarget, setRejectionTarget] = useState<{ id: string, role: string } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/admin/pending-approvals');

                // Map server data to our interface
                const fetchedMembers = (response.data?.data?.members || response.data?.data || []);
                const mappedData: AgencyApproval[] = fetchedMembers.map((u: any) => ({
                    id: u.id || u._id,
                    agencyName: u.company || u.establishment?.name || 'Unknown Agency',
                    tradeName: u.tradeName || u.establishment?.tradeName || '',
                    licenseNumber: u.establishment?.officialClassification || u.membershipNumber || 'N/A',
                    gstNumber: u.establishment?.gstRegistered ? 'Registered' : 'No',
                    city: u.city || u.location?.city || 'Unknown City',
                    district: u.district || u.location?.district || 'N/A',
                    email: u.email,
                    contactPerson: u.name || u.member?.fullName || 'N/A',
                    phone: u.phone || u.member?.mobile || 'N/A',
                    membershipType: u.membershipType || 'new',
                    submittedAt: u.registrationDate || u.createdAt,
                    approvals: {
                        president: u.approvals?.president?.approved ? 'approved' :
                            (u.approvals?.president?.approvedAt ? 'rejected' : 'pending'),
                        secretary: u.approvals?.secretary?.approved ? 'approved' :
                            (u.approvals?.secretary?.approvedAt ? 'rejected' : 'pending'),
                        treasurer: u.approvals?.treasurer?.approved ? 'approved' :
                            (u.approvals?.treasurer?.approvedAt ? 'rejected' : 'pending')
                    },
                    documents: {
                        agencyAddressProof: u.documents?.agencyAddressProof?.url || null,
                        shopPhoto: u.documents?.shopPhoto?.url || null,
                        businessCard: u.documents?.businessCard?.url || null,
                    },
                    establishment: u.establishment || {},
                    location: u.location || {}
                }));

                setAgencies(mappedData);
                setError(null);
            } catch (err: any) {
                console.error("Fetch pending failed:", err);
                setError("Unable to sync with verification server. Please refresh.");
                // Fallback to empty or previous data
            } finally {
                setLoading(false);
            }
        };

        fetchPending();
    }, []);

    const computeOverallStatus = (approvals: AgencyApproval['approvals']): ApprovalStatus => {
        const statuses = Object.values(approvals);
        if (statuses.includes('rejected')) return 'Rejected';
        const approvedCount = statuses.filter(s => s === 'approved').length;
        if (approvedCount === 3) return 'Fully Approved';
        if (approvedCount > 0) return 'Partially Approved';
        return 'Pending';
    };

    const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
        try {
            setSubmitting(true);
            const payload: any = { action };
            if (reason?.trim()) {
                payload.remarks = reason.trim();
            }

            await api.put(`/api/admin/members/${id}/approval`, payload);

            // Refresh local state
            const response = await api.get('/api/admin/pending-approvals');
            const fetchedMembers = (response.data?.data?.members || response.data?.data || []);
            const mappedData: AgencyApproval[] = fetchedMembers.map((u: any) => ({
                id: u.id || u._id,
                agencyName: u.company || u.establishment?.name || 'Unknown Agency',
                tradeName: u.tradeName || u.establishment?.tradeName || '',
                licenseNumber: u.establishment?.officialClassification || u.membershipNumber || 'N/A',
                gstNumber: u.establishment?.gstRegistered ? 'Registered' : 'No',
                city: u.city || u.location?.city || 'Unknown City',
                district: u.district || u.location?.district || 'N/A',
                email: u.email,
                contactPerson: u.name || u.member?.fullName || 'N/A',
                phone: u.phone || u.member?.mobile || 'N/A',
                membershipType: u.membershipType || 'new',
                submittedAt: u.registrationDate || u.createdAt,
                approvals: {
                    president: u.approvals?.president?.approved ? 'approved' :
                        (u.approvals?.president?.approvedAt ? 'rejected' : 'pending'),
                    secretary: u.approvals?.secretary?.approved ? 'approved' :
                        (u.approvals?.secretary?.approvedAt ? 'rejected' : 'pending'),
                    treasurer: u.approvals?.treasurer?.approved ? 'approved' :
                        (u.approvals?.treasurer?.approvedAt ? 'rejected' : 'pending')
                },
                documents: {
                    agencyAddressProof: u.documents?.agencyAddressProof?.url || null,
                    shopPhoto: u.documents?.shopPhoto?.url || null,
                    businessCard: u.documents?.businessCard?.url || null,
                },
                establishment: u.establishment || {},
                location: u.location || {}
            }));
            setAgencies(mappedData);

            // Update selected agency if modal is open
            if (isDetailsModalOpen && selectedAgency?.id === id) {
                const refreshed = mappedData.find(a => a.id === id);
                if (refreshed) {
                    setSelectedAgency(refreshed);
                } else {
                    // It was fully approved or rejected and moved out of pending
                    setIsDetailsModalOpen(false);
                    setSelectedAgency(null);
                }
            }

            // Success reset
            setIsRejectionModalOpen(false);
            setRejectionReason('');
            setRejectionTarget(null);

            // Notify user of success
            MySwal.fire({
                title: 'Success!',
                text: `Application successfully ${action === 'approve' ? 'verified' : 'rejected'}!`,
                icon: 'success',
                position: 'center',
                showConfirmButton: true,
                confirmButtonColor: '#2563eb',
            });
        } catch (err: any) {
            console.error("Action execution failed:", err);

            // Extract core message
            let errorMessage = err.response?.data?.message || err.message || "Verification synchronization failed. Please check permissions.";

            // Append specific validation errors if present from the backend
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                errorMessage = `${errorMessage}\n\nDetails:\n• ${err.response.data.errors.join('\n• ')}`;
            }

            MySwal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                position: 'center',
                showConfirmButton: true,
                confirmButtonColor: '#2563eb',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openRejectionModal = (id: string, role: string) => {
        setRejectionTarget({ id, role });
        setIsRejectionModalOpen(true);
    };

    const openDetailsModal = (agency: AgencyApproval) => {
        setSelectedAgency(agency);
        setIsDetailsModalOpen(true);
    };

    const getStatusBadge = (status: AgencyApproval['approvals'][keyof AgencyApproval['approvals']]) => {
        switch (status) {
            case 'approved':
                return <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full"><Check size={12} strokeWidth={3} /></span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 p-1 rounded-full"><X size={12} strokeWidth={3} /></span>;
            default:
                return <span className="bg-slate-100 text-slate-400 p-1 rounded-full"><Clock size={12} strokeWidth={3} /></span>;
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Agency Approvals</h1>
                    <p className="text-slate-500 mt-1 font-medium">Review and verify new travel agency applications.</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Agency Name..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full md:w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex-shrink-0 p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto flex items-center justify-center gap-2">
                        <Filter size={18} /> <span className="md:hidden font-bold text-sm">Advanced Filters</span>
                    </button>
                </div>
            </div>

            {/* Application Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Mobile View */}
                <div className="lg:hidden flex flex-col divide-y divide-slate-100">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 font-medium italic">Synchronizing with verification authority...</div>
                    ) : agencies.filter(a => a.agencyName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                    <Clock size={24} className="opacity-50" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No pending applications</h3>
                                <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                                    {error || "There are no new agency verification requests awaiting your review right now."}
                                </p>
                            </div>
                        </div>
                    ) : agencies.filter(a => a.agencyName.toLowerCase().includes(searchTerm.toLowerCase())).map((agency) => (
                        <div key={'mobile-' + agency.id} className="flex flex-col p-5 gap-4 hover:bg-slate-50/30 transition-colors group">
                            {/* Agency Header Row */}
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                        {agency.agencyName.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{agency.agencyName}</div>
                                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                            <MapPin size={10} /> {agency.city}
                                        </div>
                                    </div>
                                </div>
                                <span className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${agency.membershipType === 'new' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                    {agency.membershipType}
                                </span>
                            </div>

                            {/* Contact & Status Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Details</div>
                                    <div className="text-xs font-semibold text-slate-700 truncate">{agency.contactPerson}</div>
                                    <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{agency.phone}</div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submitted</div>
                                    <div className="text-xs font-semibold text-slate-700 truncate">
                                        {new Date(agency.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 tracking-tight mt-0.5">
                                        {new Date(agency.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                        {getStatusBadge(agency.approvals.president)}
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pres.</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        {getStatusBadge(agency.approvals.secretary)}
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Secr.</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        {getStatusBadge(agency.approvals.treasurer)}
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Treas.</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openDetailsModal(agency)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 group/btn"
                                >
                                    <Eye size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                    Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Agency Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Person</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Submitted</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Verification Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">
                                        Synchronizing with verification authority...
                                    </td>
                                </tr>
                            ) : agencies.filter(a => a.agencyName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                                <Clock size={24} className="opacity-50" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">No pending applications</h3>
                                            <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                                                {error || "There are no new agency verification requests awaiting your review right now."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : agencies.filter(a => a.agencyName.toLowerCase().includes(searchTerm.toLowerCase())).map((agency) => (
                                <tr key={agency.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                {agency.agencyName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{agency.agencyName}</div>
                                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                    <MapPin size={10} /> {agency.city}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-slate-700">{agency.contactPerson}</div>
                                        <div className="text-xs text-slate-400 font-medium">{agency.phone}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${agency.membershipType === 'new'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-indigo-50 text-indigo-700'
                                            }`}>
                                            {agency.membershipType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-slate-600 font-medium">
                                            {new Date(agency.submittedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                                            {new Date(agency.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {getStatusBadge(agency.approvals.president)}
                                                <span className="text-[9px] font-bold text-slate-400">Pres.</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                {getStatusBadge(agency.approvals.secretary)}
                                                <span className="text-[9px] font-bold text-slate-400">Secr.</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                {getStatusBadge(agency.approvals.treasurer)}
                                                <span className="text-[9px] font-bold text-slate-400">Treas.</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openDetailsModal(agency)}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all group/btn"
                                            >
                                                <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                View Details
                                            </button>

                                            {(() => {
                                                const overallStatus = computeOverallStatus(agency.approvals);
                                                const currentRole = user?.role?.toLowerCase();
                                                const isFinalized = overallStatus === 'Fully Approved' || overallStatus === 'Rejected';

                                                if (isFinalized) {
                                                    return (
                                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${overallStatus === 'Fully Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                            }`}>
                                                            {overallStatus}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Re-designed Agency Details Modal */}
                {isDetailsModalOpen && selectedAgency && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <h2 className="text-xl font-bold text-slate-900">Member Verification Details</h2>
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                                {/* Profile Header Card */}
                                <div className="flex items-center gap-5 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold text-2xl">
                                        {selectedAgency.contactPerson?.charAt(0) || <User size={30} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900">{selectedAgency.contactPerson}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium text-slate-600">{selectedAgency.tradeName || selectedAgency.agencyName}</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                                                {selectedAgency.membershipType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                            <Calendar size={14} className="opacity-70" />
                                            Submitted on {new Date(selectedAgency.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                    {/* Action Box Inside Profile header mimicking the status / avg response time area of the ref design */}
                                    <div className="hidden sm:flex flex-col items-end gap-2 pl-4 border-l border-slate-100">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${computeOverallStatus(selectedAgency.approvals) === 'Fully Approved' ? 'bg-emerald-50 text-emerald-600' :
                                            computeOverallStatus(selectedAgency.approvals) === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                            {computeOverallStatus(selectedAgency.approvals)}
                                        </span>
                                    </div>
                                </div>

                                {/* Shared Grid Layout for Sections */}
                                <div className="space-y-8">
                                    {/* Contact Information */}
                                    <section>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Contact Information</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">District / Region</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.district || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.city || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Business Details Section */}
                                    <section>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-t border-slate-100 pt-8">Business Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Type</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.establishment?.businessType || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Official Classification</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.establishment?.officialClassification || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">GST Registered</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.establishment?.gstRegistered ? 'Yes' : 'No'}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year of Establishment</span>
                                                <p className="text-sm font-medium text-slate-900">{selectedAgency.establishment?.yearOfEstablishment || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Submitted Documents Section */}
                                    <section>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-t border-slate-100 pt-8">Submitted Documents</h4>
                                        <div className="flex flex-col gap-3">
                                            {[
                                                { label: 'Agency Address Proof', id: 'proof', url: selectedAgency.documents?.agencyAddressProof },
                                                { label: 'Shop/Agency Photo', id: 'photo', url: selectedAgency.documents?.shopPhoto },
                                            ].map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={18} className="text-slate-400" />
                                                        <span className="text-sm font-semibold text-slate-800">{doc.label}</span>
                                                    </div>
                                                    {doc.url ? (
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-400 italic px-2 py-1">Not Uploaded</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>

                                {(() => {
                                    const role = user?.role?.toLowerCase();
                                    const status = role ? (selectedAgency.approvals as any)[role] : null;

                                    if (role && ['president', 'secretary', 'treasurer'].includes(role) && status === 'pending') {
                                        return (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => openRejectionModal(selectedAgency.id, role)}
                                                    disabled={submitting}
                                                    className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                                                >
                                                    Reject Application
                                                </button>
                                                <button
                                                    onClick={() => handleAction(selectedAgency.id, 'approve')}
                                                    disabled={submitting}
                                                    className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                                                >
                                                    Verify Member
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <p className="text-xs font-bold text-slate-400 italic">No actions available for your role.</p>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Reasons Modal (Architectural implementation over style) */}
                {isRejectionModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200">
                            <h3 className="text-xl font-black text-slate-900 italic mb-2 tracking-tight">Mandatory Rejection Reason</h3>
                            <p className="text-sm text-slate-500 mb-6 font-medium">Please provide a clear justification for rejecting <span className="text-slate-900 font-bold">"{rejectionTarget?.role}"</span> verification.</p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="E.g., Document clarity issues, Invalid License Number..."
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all mb-6 resize-none"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsRejectionModalOpen(false)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => rejectionTarget && handleAction(rejectionTarget.id, 'reject', rejectionReason)}
                                    disabled={!rejectionReason.trim() || submitting}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
