import React, { useState, useEffect } from "react";
import api from "../../services/api/axios";
import Swal from 'sweetalert2';
import {
  Search,
  Filter,
  ChevronDown,
  MapPin,
  CreditCard,
  Eye,
  Edit,
  Ban,
  Unlock,
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  MoreVertical,
  Calendar,
  Trash2,
  Check,
  X
} from "lucide-react";

interface Member {
  id: string;
  membershipNumber: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  district: string;
  certificateExpiry: string | null;
  membershipStatus: string;
  registrationDate: string;
  isActive: boolean;
}

const mockAgencies: Member[] = []; // Prefer live sync from identity server

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/members');

      // Map backend nesting to our UI-friendly flat interface
      const fetchedMembers = (response.data?.data?.members || []).map((user: any) => ({
        id: user.id || user._id,
        membershipNumber: user.membershipNumber || 'N/A',
        name: user.name || user.member?.fullName || 'Unknown',
        company: user.company || user.establishment?.name || 'Unknown Agency',
        email: user.email,
        phone: user.phone || user.member?.mobile || 'N/A',
        district: user.district || user.location?.district || 'N/A',
        certificateExpiry: user.certificateExpiry || (user.certificate?.expiryDate) || null,
        membershipStatus: user.membershipStatus || user.status || 'submitted',
        registrationDate: user.registrationDate || user.createdAt,
        isActive: user.isActive !== false
      }));

      setMembers(fetchedMembers);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch members:", err);
      setError("Synchronization issue with the identity server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAction = async (agencyId: string, actionType: string, currentName: string) => {
    let endpoint = '';
    let method = 'PUT';
    let data = {};
    let confirmConfig: any = {};

    switch (actionType) {
      case 'block':
        endpoint = `/api/admin/members/${agencyId}/block`;
        data = { action: 'block' };
        confirmConfig = { title: 'Suspend Agency?', text: `Are you sure you want to block ${currentName}? They will be denied access.`, icon: 'warning', confirmButtonText: 'Yes, block them' };
        break;
      case 'unblock':
        endpoint = `/api/admin/members/${agencyId}/block`;
        data = { action: 'unblock' };
        confirmConfig = { title: 'Unblock Agency?', text: `Allow ${currentName} to access the platform again?`, icon: 'question', confirmButtonText: 'Yes, unblock' };
        break;
      case 'delete':
        endpoint = `/api/admin/members/${agencyId}`;
        method = 'DELETE';
        confirmConfig = {
          title: 'Delete Agency Permanently?',
          text: `This will permanently delete ${currentName}'s profile and all associated data. This action cannot be undone.`,
          icon: 'error',
          confirmButtonText: 'Yes, delete it',
          confirmButtonColor: '#ef4444'
        };
        break;
      case 'approve':
        endpoint = `/api/admin/members/${agencyId}/approval`;
        data = { action: 'approve', remarks: 'Approved from members directory' };
        confirmConfig = { title: 'Approve Agency?', text: `Approve ${currentName}'s application?`, icon: 'question', confirmButtonText: 'Yes, approve' };
        break;
      case 'reject':
        endpoint = `/api/admin/members/${agencyId}/approval`;
        data = { action: 'reject', remarks: 'Rejected from members directory' };
        confirmConfig = { title: 'Reject Application?', text: `Are you sure you want to reject ${currentName}?`, icon: 'warning', confirmButtonText: 'Yes, reject', confirmButtonColor: '#ef4444' };
        break;
    }

    try {
      const result = await Swal.fire({
        ...confirmConfig,
        showCancelButton: true,
        cancelButtonColor: '#94a3b8',
      });

      if (result.isConfirmed) {
        setLoadingAction(agencyId + actionType);

        let apiResponse;
        if (method === 'DELETE') {
          await api.delete(endpoint);

          setMembers(prev => prev.filter(m => m.id !== agencyId));

          Swal.fire({
            title: 'Deleted!',
            text: `${currentName} has been fully removed.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

        } else {
          apiResponse = await api.put(endpoint, data);

          if (actionType === 'block' || actionType === 'unblock') {
            const returnedIsActive = apiResponse.data?.data?.isActive ?? (actionType === 'unblock');
            setMembers(prev => prev.map(m => m.id === agencyId ? { ...m, isActive: returnedIsActive } : m));
          } else if (actionType === 'approve' || actionType === 'reject') {
            const returnedStatus = apiResponse.data?.data?.status || (actionType === 'reject' ? 'rejected' : 'pending');
            setMembers(prev => prev.map(m => m.id === agencyId ? { ...m, membershipStatus: returnedStatus } : m));
          }

          Swal.fire({
            title: 'Success!',
            text: `Action executed successfully.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      }
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to complete action.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-inset";
    switch (status.toLowerCase()) {
      case "approved":
      case "verified":
        return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
      case "submitted":
      case "pending":
        return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
      case "rejected":
        return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
      default:
        return `${base} bg-slate-50 text-slate-500 ring-slate-200`;
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight italic text-primary">Member Management</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 font-medium italic">Directory of all fully approved and active travel agencies.</p>
        </div>

        <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search Agencies..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full md:w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex-shrink-0">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col w-full pb-8">

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency & License</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrant</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-20 text-slate-400 italic font-medium">Loading synchronization...</td></tr>
                ) : members.filter(m => m.company.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                          <Building2 size={24} className="opacity-50" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">No active members found</h3>
                        <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                          {error || "Only fully approved agencies with all three admin verifications are displayed in this directory."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : members.filter(m => m.company.toLowerCase().includes(searchTerm.toLowerCase())).map((agency) => (
                  <tr key={agency.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">{agency.company}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                            {agency.membershipNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-700">{agency.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={10} className="text-slate-300" /> {agency.district || 'Kerala'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Mail size={12} className="text-slate-300" /> {agency.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone size={12} className="text-slate-300" /> {agency.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-slate-700">{formatDate(agency.registrationDate)}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Date Joined</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-slate-700">{formatDate(agency.certificateExpiry)}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${!agency.certificateExpiry ? 'text-amber-500' : 'text-slate-400'}`}>
                        {agency.certificateExpiry ? 'Valid Thru' : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={getStatusBadge(agency.membershipStatus)}>
                          {agency.membershipStatus}
                        </span>
                        {!agency.isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 shadow-[0_0_8px_rgba(225,29,72,0.2)]">
                            Blocked
                          </span>
                        )}
                        {agency.isActive && ['active', 'verified', 'approved'].includes(agency.membershipStatus.toLowerCase()) && (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {agency.isActive && ['pending', 'submitted'].includes(agency.membershipStatus?.toLowerCase()) && (
                          <>
                            <button onClick={() => handleAction(agency.id, 'approve', agency.company)} disabled={loadingAction === agency.id + 'approve'} className={`p-2 rounded-xl transition-all ${loadingAction === agency.id + 'approve' ? 'text-slate-300' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Approve">
                              <Check size={18} />
                            </button>
                            <button onClick={() => handleAction(agency.id, 'reject', agency.company)} disabled={loadingAction === agency.id + 'reject'} className={`p-2 rounded-xl transition-all ${loadingAction === agency.id + 'reject' ? 'text-slate-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title="Reject">
                              <X size={18} />
                            </button>
                          </>
                        )}

                        {agency.isActive ? (
                          <button onClick={() => handleAction(agency.id, 'block', agency.company)} disabled={loadingAction === agency.id + 'block'} className={`p-2 rounded-xl transition-all ${loadingAction === agency.id + 'block' ? 'text-slate-300' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title="Suspend Agency">
                            <Ban size={18} />
                          </button>
                        ) : (
                          <button onClick={() => handleAction(agency.id, 'unblock', agency.company)} disabled={loadingAction === agency.id + 'unblock'} className={`p-2 rounded-xl transition-all ${loadingAction === agency.id + 'unblock' ? 'text-slate-300' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Unblock Agency">
                            <Unlock size={18} />
                          </button>
                        )}

                        <button onClick={() => handleAction(agency.id, 'delete', agency.company)} disabled={loadingAction === agency.id + 'delete'} className={`p-2 rounded-xl transition-all ${loadingAction === agency.id + 'delete' ? 'text-slate-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title="Delete Profile">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile / Tablet Card View */}
        <div className="lg:hidden flex flex-col gap-4 w-full">
          {loading ? (
            <div className="text-center py-20 text-slate-400 italic font-medium">Loading synchronization...</div>
          ) : members.filter(m => m.company.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                  <Building2 size={24} className="opacity-50" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No active members found</h3>
                <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                  {error || "Only fully approved agencies with all three admin verifications are displayed in this directory."}
                </p>
              </div>
            </div>
          ) : members.filter(m => m.company.toLowerCase().includes(searchTerm.toLowerCase())).map((agency) => (
            <div key={agency.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5 relative overflow-hidden transition-all hover:border-blue-200">

              {/* Card Header */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-4 flex-1 pr-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold border border-slate-100 flex-shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div className="flex flex-col pt-0.5 min-w-0">
                    <div className="font-extrabold text-slate-900 leading-tight text-base truncate">{agency.company}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 truncate">{agency.membershipNumber}</div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col gap-1 items-start">
                <span className={getStatusBadge(agency.membershipStatus)}>{agency.membershipStatus}</span>
                {!agency.isActive && (
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 shadow-[0_0_8px_rgba(225,29,72,0.2)]">
                    Blocked
                  </span>
                )}
                {agency.isActive && ['active', 'verified', 'approved'].includes(agency.membershipStatus.toLowerCase()) && (
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                    Active
                  </span>
                )}
              </div>

              {/* Data Grid */}
              <div className="bg-slate-50/60 rounded-2xl p-4 grid grid-cols-2 gap-y-5 gap-x-3 border border-slate-100/50">
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1"><MapPin size={9} /> Registrant</div>
                  <div className="text-xs font-bold text-slate-700 truncate">{agency.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                    {agency.district || 'Kerala'}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1"><Mail size={9} /> Contact</div>
                  <div className="text-[10px] text-slate-600 font-semibold mb-1 truncate">
                    {agency.email}
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold truncate flex items-center gap-1">
                    <Phone size={10} className="text-slate-400" /> {agency.phone}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Registration</div>
                  <div className="text-xs font-bold text-slate-700 truncate">{formatDate(agency.registrationDate)}</div>
                </div>

                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Expiry</div>
                  <div className={`text-xs font-bold flex items-center gap-1.5 truncate ${!agency.certificateExpiry ? 'text-amber-600' : 'text-slate-700'}`}>
                    <Calendar size={12} className={!agency.certificateExpiry ? 'text-amber-500' : 'text-slate-400 flex-shrink-0'} />
                    <span className="truncate">{agency.certificateExpiry ? formatDate(agency.certificateExpiry) : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Agency</span>
                <div className="flex gap-2">
                  {agency.isActive && ['pending', 'submitted'].includes(agency.membershipStatus?.toLowerCase()) && (
                    <>
                      <button onClick={() => handleAction(agency.id, 'approve', agency.company)} disabled={loadingAction === agency.id + 'approve'} className={`p-2.5 rounded-xl transition-all border border-slate-100 bg-white shadow-sm ${loadingAction === agency.id + 'approve' ? 'text-slate-300' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleAction(agency.id, 'reject', agency.company)} disabled={loadingAction === agency.id + 'reject'} className={`p-2.5 rounded-xl transition-all border border-slate-100 bg-white shadow-sm ${loadingAction === agency.id + 'reject' ? 'text-slate-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title="Reject">
                        <X size={16} />
                      </button>
                    </>
                  )}

                  {agency.isActive ? (
                    <button onClick={() => handleAction(agency.id, 'block', agency.company)} disabled={loadingAction === agency.id + 'block'} className={`p-2.5 rounded-xl transition-all border border-slate-100 bg-white shadow-sm ${loadingAction === agency.id + 'block' ? 'text-slate-300' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title="Suspend">
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button onClick={() => handleAction(agency.id, 'unblock', agency.company)} disabled={loadingAction === agency.id + 'unblock'} className={`p-2.5 rounded-xl transition-all border border-slate-100 bg-white shadow-sm ${loadingAction === agency.id + 'unblock' ? 'text-slate-300' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Unblock">
                      <Unlock size={16} />
                    </button>
                  )}

                  <button onClick={() => handleAction(agency.id, 'delete', agency.company)} disabled={loadingAction === agency.id + 'delete'} className={`p-2.5 rounded-xl transition-all border border-slate-100 bg-white shadow-sm ${loadingAction === agency.id + 'delete' ? 'text-slate-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Members;
