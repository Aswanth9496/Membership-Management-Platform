import React, { useState, useEffect } from "react";
import api from "../../services/api/axios";
import Swal from 'sweetalert2';
import {
    Search,
    UserX,
    Mail,
    Building2,
    Calendar,
    Eye,
    Trash2,
    RefreshCcw,
    CheckCircle2
} from "lucide-react";

interface RejectedMember {
    id: string;
    name: string;
    company: string;
    email: string;
    rejectionReason: string | null;
    registrationDate: string;
    status: string;
}

export const RejectedUsers: React.FC = () => {
    const [members, setMembers] = useState<RejectedMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRejectedMembers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/members?status=rejected&limit=100');

            const fetchedMembers = (response.data?.data?.members || []).map((user: any) => ({
                id: user.id || user._id,
                name: user.name || user.member?.fullName || 'Unknown',
                company: user.company || user.establishment?.name || 'Unknown Agency',
                email: user.email,
                rejectionReason: user.rejectionReason || 'No reason provided',
                registrationDate: user.registrationDate || user.createdAt,
                status: user.status || 'rejected'
            }));

            setMembers(fetchedMembers);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch rejected members:", err);
            setError("Synchronization issue with the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRejectedMembers();
    }, []);

    const handleAction = async (agencyId: string, actionType: string, currentName: string) => {
        let endpoint = '';
        let method = 'PUT';
        let data = {};
        let confirmConfig: any = {};

        switch (actionType) {
            case 'delete':
                endpoint = `/api/admin/members/${agencyId}`;
                method = 'DELETE';
                confirmConfig = {
                    title: 'Permanently Delete?',
                    text: `This will permanently delete ${currentName}'s profile. This action cannot be undone.`,
                    icon: 'error',
                    confirmButtonText: 'Yes, permanently delete',
                    confirmButtonColor: '#ef4444'
                };
                break;
            case 'approve':
                endpoint = `/api/admin/members/${agencyId}/approval`;
                data = { action: 'approve', remarks: 'Re-approved from rejected list' };
                confirmConfig = {
                    title: 'Re-Approve User?',
                    text: `Are you sure you want to approve ${currentName}? This will advance them to the active system.`,
                    icon: 'question',
                    confirmButtonText: 'Yes, re-approve'
                };
                break;
            case 'viewDetails':
                Swal.fire({
                    title: `<span class="italic text-slate-800 font-extrabold tracking-tight">${currentName}</span>`,
                    html: `
            <div class="text-left text-sm flex flex-col gap-3 font-medium text-slate-600 mt-2 bg-slate-50 p-6 rounded-2xl ring-1 ring-slate-100">
               <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                  <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Status</span> <span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-rose-100 text-rose-700">REJECTED</span></div>
               </div>
               <p class="mt-2 text-rose-600 italic max-h-40 overflow-y-auto leading-relaxed border-l-2 border-rose-300 pl-4 py-1">Contact ${currentName} directly via email if you need to reconsider their portfolio.</p>
            </div>
          `,
                    width: '500px',
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Close File',
                    customClass: { htmlContainer: 'p-0', title: 'p-5 pt-8 text-2xl' }
                });
                return;
        }

        try {
            const result = await Swal.fire({
                ...confirmConfig,
                showCancelButton: true,
                cancelButtonColor: '#94a3b8',
            });

            if (result.isConfirmed) {
                setLoading(true);

                if (method === 'DELETE') {
                    await api.delete(endpoint);
                    setMembers(prev => prev.filter(m => m.id !== agencyId));
                    Swal.fire({
                        title: 'Deleted!',
                        text: `${currentName} has been permanently removed.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    await api.put(endpoint, data);
                    setMembers(prev => prev.filter(m => m.id !== agencyId));
                    Swal.fire({
                        title: 'Approved!',
                        text: `${currentName} has been re-approved.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                title: 'Error',
                text: err.response?.data?.message || 'Action failed on the server.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0 pb-20">
            {/* Header aligned like Members.tsx */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight italic text-primary">Rejected Profiles</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 font-medium italic">Review denied applications and revoked memberships.</p>
                </div>

                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Rejected Users..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full md:w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full pb-8">
                <div className="hidden xl:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[300px]">Profile</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Company Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Rejection Reason</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right min-w-[150px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-20 text-slate-400 italic font-medium">Synchronizing database...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={5} className="text-center py-20 text-rose-500 font-medium">{error}</td></tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                                    <UserX size={24} className="opacity-50" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No files found</h3>
                                                <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                                                    Clean record! There are no heavily rejected applications recorded.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold border border-rose-100 transition-colors uppercase shrink-0">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="min-w-[150px]">
                                                    <div className="font-bold text-slate-900 truncate" title={member.name}>{member.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate" title={member.email}>
                                                        <Mail size={12} className="text-slate-400" /> {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1 min-w-[150px]">
                                                <div className="flex items-center gap-2 text-xs text-slate-700 font-bold truncate" title={member.company}>
                                                    <Building2 size={12} className="text-slate-400 shrink-0" /> <span className="truncate">{member.company}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">
                                                    <Calendar size={12} className="shrink-0" /> Applied: {new Date(member.registrationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs text-slate-600 italic font-medium max-w-[250px] truncate" title={member.rejectionReason || ''}>
                                                "{member.rejectionReason}"
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                <UserX size={12} /> Rejected
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleAction(member.id, 'viewDetails', member.name)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
                                                <button onClick={() => handleAction(member.id, 'approve', member.name)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Re-Approve"><CheckCircle2 size={18} /></button>
                                                <button onClick={() => handleAction(member.id, 'delete', member.name)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Permanently Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="xl:hidden flex flex-col gap-4 w-full">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 italic font-medium">Synchronizing database...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2"><UserX size={24} className="opacity-50" /></div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No records found</h3>
                            </div>
                        </div>
                    ) : filteredMembers.map((member) => (
                        <div key={member.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5 relative overflow-hidden transition-all hover:border-blue-200">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-start gap-4 flex-1 pr-2">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold border border-rose-100 uppercase">{member.name.charAt(0)}</div>
                                    <div className="flex flex-col pt-0.5 min-w-0">
                                        <div className="font-extrabold text-slate-900 truncate text-base">{member.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1 truncate"><Building2 size={10} /> {member.company}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 flex items-center gap-1.5"><UserX size={10} /> Rejected</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleAction(member.id, 'approve', member.name)} className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 rounded-xl"><CheckCircle2 size={14} /></button>
                                    <button onClick={() => handleAction(member.id, 'delete', member.name)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="bg-slate-50/60 rounded-2xl p-4 grid grid-cols-1 gap-y-3 border border-slate-100/50">
                                <div className="min-w-0">
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Rejection Reason</div>
                                    <div className="text-xs font-bold text-slate-700 italic">"{member.rejectionReason}"</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RejectedUsers;
