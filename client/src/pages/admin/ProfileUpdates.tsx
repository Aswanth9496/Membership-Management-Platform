import React, { useState, useEffect, useMemo } from 'react';
import { UserCog, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Calendar } from 'lucide-react';
import api from '../../services/api/axios';
import MySwal from '../../utils/swal';

interface ProfileUpdateReq {
    id: string;
    userId: string;
    userName: string;
    email: string;
    phone: string;
    establishment: string;
    currentData: any;
    requestedData: any;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

export default function ProfileUpdateRequests() {
    const [requests, setRequests] = useState<ProfileUpdateReq[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/profile-updates');
            setRequests(res.data.data || []);
        } catch (err) {
            MySwal.fire('Error', 'Failed to fetch profile update requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
    const processedRequests = useMemo(() => requests.filter(r => r.status !== 'pending'), [requests]);

    const flattenObject = (obj: any, prefix = '') => {
        const result: any = {};
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                Object.assign(result, flattenObject(obj[key], `${prefix}${key}.`));
            } else {
                result[`${prefix}${key}`] = obj[key];
            }
        }
        return result;
    };

    const handleReview = (req: ProfileUpdateReq) => {
        const flatCurrent = flattenObject(req.currentData);
        const flatRequested = flattenObject(req.requestedData);

        const changes: any[] = [];
        for (const key in flatRequested) {
            if (flatCurrent[key] !== flatRequested[key]) {
                changes.push({
                    field: key,
                    old: flatCurrent[key] || 'N/A',
                    new: flatRequested[key]
                });
            }
        }

        let changesHtml = changes.map(c => `
      <div class="mb-3 border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
        <div class="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">${c.field}</div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-rose-50 p-2 rounded-lg border border-rose-100">
            <span class="text-[9px] uppercase font-bold text-rose-500 block mb-0.5">Current Value</span>
            <span class="text-sm font-medium text-rose-900 break-words">${c.old}</span>
          </div>
          <div class="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
            <span class="text-[9px] uppercase font-bold text-emerald-600 block mb-0.5">Requested Value</span>
            <span class="text-sm font-bold text-emerald-900 break-words">${c.new}</span>
          </div>
        </div>
      </div>
    `).join('');

        if (changes.length === 0) {
            changesHtml = '<div class="p-4 text-center text-slate-500 italic">No exact differences detected or purely structural update.</div>';
        }

        MySwal.fire({
            title: `<span class="italic text-slate-800 font-extrabold tracking-tight">Review Update</span>`,
            html: `
        <div class="text-left mt-2 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-100">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
             <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                ${req.userName.charAt(0).toUpperCase()}
             </div>
             <div>
               <div class="font-bold text-slate-800">${req.userName}</div>
               <div class="text-xs text-slate-500">${req.email} • ${req.phone}</div>
             </div>
          </div>
          
          <h4 class="text-xs font-bold text-slate-700 uppercase mb-3">Requested Changes</h4>
          <div class="max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
             ${changesHtml}
          </div>
        </div>
      `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Approve',
            denyButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10b981', // emerald
            denyButtonColor: '#f43f5e',   // rose
            width: '600px',
            customClass: {
                htmlContainer: 'p-0 text-left cursor-default',
                title: 'p-5 pt-8 text-2xl text-left'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                processRequest(req.id, 'approve');
            } else if (result.isDenied) {
                const { value: reason } = await MySwal.fire({
                    title: 'Reject Update',
                    input: 'text',
                    inputLabel: 'Reason for rejection',
                    inputPlaceholder: 'Enter reason...',
                    showCancelButton: true,
                    confirmButtonText: 'Confirm Rejection',
                    confirmButtonColor: '#f43f5e',
                    inputValidator: (value) => {
                        if (!value) return 'You need to write a reason!'
                    }
                });

                if (reason) {
                    processRequest(req.id, 'reject', reason);
                }
            }
        });
    };

    const processRequest = async (id: string, action: 'approve' | 'reject', rejectionReason?: string) => {
        try {
            MySwal.fire({
                title: 'Processing...',
                text: 'Updating member profile mapping',
                allowOutsideClick: false,
                didOpen: () => {
                    MySwal.showLoading()
                }
            });

            await api.put(`/api/admin/profile-updates/${id}/review`, {
                action,
                rejectionReason
            });

            MySwal.fire('Success', `Profile update has been ${action}d.`, 'success');
            fetchRequests();
        } catch (err: any) {
            MySwal.fire('Error', err.response?.data?.message || 'Failed to process request', 'error');
        }
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight italic text-primary">Profile Update Requests</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 font-medium italic">Review and approve member profile changes safely.</p>
                </div>
            </div>

            {/* Pending Section */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-amber-500" /> Pending Review ({pendingRequests.length})</h2>
                {loading ? (
                    <div className="py-10 text-center text-slate-400 italic">Loading requests...</div>
                ) : pendingRequests.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
                        <CheckCircle className="mx-auto text-emerald-400 mb-3" size={40} />
                        <h3 className="text-slate-700 font-bold mb-1">All Caught Up!</h3>
                        <p className="text-sm text-slate-500">There are no pending profile update requests right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            {req.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 leading-tight">{req.userName}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[150px]">{req.email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Changes Requested</div>
                                    <div className="text-sm font-medium text-slate-700">{Object.keys(flattenObject(req.requestedData)).length} fields modified</div>
                                </div>

                                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(req.requestedAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={() => handleReview(req)}
                                        className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-600 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Eye size={14} /> Review
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Processed Section */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-slate-400" /> Processed History</h2>
                <div className="flex flex-col w-full pb-8">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {processedRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm">
                                                No processed history yet.
                                            </td>
                                        </tr>
                                    ) : processedRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50/30 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{req.userName}</div>
                                                <div className="text-xs text-slate-500">{req.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] font-bold text-slate-600">Req: {new Date(req.requestedAt).toLocaleDateString()}</div>
                                                {req.reviewedAt && (
                                                    <div className="text-[11px] font-medium text-slate-400">Rev: {new Date(req.reviewedAt).toLocaleDateString()}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'approved' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-black uppercase tracking-widest inline-flex items-center gap-1"><CheckCircle size={12} /> Approved</span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-black uppercase tracking-widest inline-flex items-center gap-1"><XCircle size={12} /> Rejected</span>
                                                        {req.rejectionReason && <span className="text-[9px] font-bold text-slate-400 max-w-[200px] truncate" title={req.rejectionReason}>Reason: {req.rejectionReason}</span>}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
