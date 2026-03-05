import React, { useEffect, useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import api from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    RefreshCw,
    Calendar,
    Download,
    Info,
    AlertTriangle,
    Mail,
    Check,
    MapPin,
    Video,
    Receipt
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Dashboard() {
    const { user } = useAppSelector((state: any) => state.auth);
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user?.role && user.role !== 'member') {
                navigate('/admin/dashboard', { replace: true });
                return;
            }

            try {
                const [profileRes, eventsRes] = await Promise.all([
                    api.get('/api/member/profile'),
                    api.get('/api/member/events/my-events').catch(() => ({ data: { data: { events: [] } } }))
                ]);

                setProfile(profileRes.data.data.member || profileRes.data.data.user);
                setMyEvents(eventsRes.data.data.events || []);
            } catch (error) {
                console.error('Failed to fetch profile', error);
                Swal.fire('Error', 'Could not load your secure dashboard.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    const recentPayments = useMemo(() => {
        let payments: any[] = [];

        if (profile?.payment?.amount > 0) {
            payments.push({
                id: 'reg_payment',
                date: profile.payment.paymentDate || profile.createdAt || new Date(),
                description: 'Membership Registration',
                amount: profile.payment.amount,
                status: profile.payment.status
            });
        }

        if (profile?.renewalHistory && Array.isArray(profile.renewalHistory)) {
            profile.renewalHistory.forEach((ren: any, i: number) => {
                if (ren.amount > 0) {
                    payments.push({
                        id: `ren_${i}`,
                        date: ren.renewalDate || new Date(),
                        description: 'Membership Renewal',
                        amount: ren.amount,
                        status: ren.status
                    });
                }
            });
        }

        if (myEvents && Array.isArray(myEvents)) {
            myEvents.forEach((evt: any) => {
                const reg = evt.registrationDetails;
                if (reg?.amount > 0) {
                    payments.push({
                        id: `evt_${evt.id}`,
                        date: reg.registeredAt || evt.eventDate?.startDate || new Date(),
                        description: `Event Ticket: ${evt.title}`,
                        amount: reg.amount,
                        status: reg.paymentStatus || 'completed'
                    });
                }
            });
        }

        return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    }, [profile, myEvents]);

    // Using mostly static data from context of the redesign per the image, mixed with some real profile data.
    const fullName = profile?.fullName || user?.name || 'Alex Johnson';
    const firstName = fullName.split(' ')[0] || 'Alex';

    return (
        <div className="w-full max-w-7xl mx-auto font-sans text-slate-900 pb-10">
            {profile?.status === 'verified' && (
                <div className="mt-4 mb-8 bg-amber-50 border border-amber-200 rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl text-amber-500 shadow-sm border border-amber-100/50">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-amber-900 text-lg tracking-tight">Payment Pending</h3>
                            <p className="text-amber-700 text-[13px] font-semibold mt-0.5">Please complete your membership payment to become fully approved.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/certificate')}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[14px] font-bold rounded-xl transition-all shadow-sm shadow-amber-200 whitespace-nowrap border border-amber-600/20"
                    >
                        Complete Payment
                    </button>
                </div>
            )}

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <p className="text-[11px] font-bold text-blue-600 tracking-[0.15em] uppercase mb-2">Overview</p>
                    <h1 className="text-[32px] sm:text-[40px] leading-none font-extrabold tracking-tight text-slate-900">
                        Welcome back, {firstName}
                    </h1>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm shrink-0">
                    {profile?.status === 'approved' ? (
                        <>
                            <div className="w-10 h-10 rounded-full bg-[#E8F8EE] flex items-center justify-center shrink-0 border border-emerald-100">
                                <CheckCircle2 className="text-[#05A660]" size={20} fill="currentColor" stroke="white" strokeWidth={1} />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                                <p className="text-[14px] font-bold text-slate-900">Membership Active</p>
                            </div>
                        </>
                    ) : profile?.status === 'verified' ? (
                        <>
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                <AlertTriangle className="text-amber-500" size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                                <p className="text-[14px] font-bold text-slate-900">Payment Pending</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                                <Info className="text-slate-400" size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                                <p className="text-[14px] font-bold text-slate-900">Awaiting Admin Verification</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
                <div onClick={() => navigate('/certificate')} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer py-8">
                    <div className="text-blue-600">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>
                    <span className="font-bold text-[15px]">Download Certificate</span>
                </div>

                <div onClick={() => navigate('/certificate')} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer py-8">
                    <div className="text-blue-600">
                        <RefreshCw size={28} />
                    </div>
                    <span className="font-bold text-[15px]">Renew Membership</span>
                </div>

                <div onClick={() => navigate('/events')} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer py-8">
                    <div className="text-blue-600">
                        <Calendar size={28} />
                    </div>
                    <span className="font-bold text-[15px]">Upcoming Events</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                {/* Left Column */}
                <div className="flex-1 min-w-0">
                    {/* Registered Upcoming Events */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold flex items-center gap-2.5">
                                <Calendar size={20} className="text-blue-600" />
                                Registered Upcoming Events
                            </h2>
                            <button onClick={() => navigate('/events')} className="text-[13px] font-bold text-blue-600 hover:text-blue-700">View All</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                            {myEvents.length === 0 ? (
                                <div className="sm:col-span-2 p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                                    <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">You haven't registered for any upcoming events.</p>
                                    <button onClick={() => navigate('/events')} className="mt-4 text-xs font-bold text-blue-600 hover:underline">Explore Events</button>
                                </div>
                            ) : (
                                myEvents.slice(0, 2).map((event: any, idx: number) => {
                                    const d = event.eventDate?.startDate ? new Date(event.eventDate.startDate) : new Date();
                                    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                                    const day = d.getDate().toString().padStart(2, '0');
                                    const gradient = idx % 2 === 0 ? "from-slate-300 to-slate-500" : "from-slate-400 to-slate-700";

                                    return (
                                        <div key={event.id || idx} className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                                            <div className={`h-[140px] bg-gradient-to-br ${gradient} relative p-4 flex flex-col justify-between items-start`}>
                                                <div className="absolute top-4 right-4 bg-white rounded-lg flex flex-col items-center justify-center w-[46px] h-[52px] shadow-sm">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-[-2px]">{month}</span>
                                                    <span className="text-[18px] font-black leading-none text-slate-900">{day}</span>
                                                </div>
                                                <div className="mt-auto">
                                                    <span className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                                                        {event.eventType || 'Event'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <h3 className="font-bold text-[16px] mb-2 leading-snug truncate">{event.title}</h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium mb-5">
                                                    {event.eventType?.toLowerCase().includes('webinar') ? <Video size={14} /> : <MapPin size={14} />}
                                                    <span className="truncate">{event.venue?.city || 'Online'}</span>
                                                </div>
                                                <button onClick={() => navigate('/events')} className="w-full mt-auto bg-slate-100 hover:bg-slate-200 font-bold text-[13px] py-2.5 rounded-xl transition-colors text-slate-800">
                                                    Event Details
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold flex items-center gap-2.5">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                                Recent Payments
                            </h2>
                            <button className="text-[13px] font-bold text-blue-600 hover:text-blue-700">View History</button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse block sm:table">
                                    <thead className="hidden sm:table-header-group">
                                        <tr className="border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-500">
                                            <th className="py-4 px-6 font-semibold">Date</th>
                                            <th className="py-4 px-6 font-semibold">Description</th>
                                            <th className="py-4 px-6 font-semibold">Amount</th>
                                            <th className="py-4 px-6 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[14px] block sm:table-row-group">
                                        {recentPayments.length === 0 ? (
                                            <tr className="block sm:table-row">
                                                <td colSpan={4} className="py-12 px-6 text-center block sm:table-cell">
                                                    <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                                                    <p className="text-sm font-medium text-slate-500">No recent payments found.</p>
                                                    <p className="text-xs text-slate-400 mt-1">When you make a transaction, it will appear here.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            recentPayments.map((payment) => (
                                                <tr key={payment.id} className="block sm:table-row border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors p-5 sm:p-0">
                                                    <td className="flex items-center justify-between sm:table-cell py-2 sm:py-4 px-0 sm:px-6 text-slate-500 whitespace-nowrap">
                                                        <span className="sm:hidden font-bold text-[11px] uppercase tracking-widest text-slate-400">Date</span>
                                                        {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="flex items-center justify-between sm:table-cell py-2 sm:py-4 px-0 sm:px-6 font-medium text-slate-800" title={payment.description}>
                                                        <span className="sm:hidden font-bold text-[11px] uppercase tracking-widest text-slate-400">Description</span>
                                                        <span className="truncate max-w-[180px] sm:max-w-[200px] text-right sm:text-left">{payment.description}</span>
                                                    </td>
                                                    <td className="flex items-center justify-between sm:table-cell py-2 sm:py-4 px-0 sm:px-6 font-bold text-slate-900 whitespace-nowrap">
                                                        <span className="sm:hidden font-bold text-[11px] uppercase tracking-widest text-slate-400">Amount</span>
                                                        ₹{payment.amount?.toLocaleString()}
                                                    </td>
                                                    <td className="flex items-center justify-between sm:table-cell py-2 sm:py-4 px-0 sm:px-6 sm:whitespace-nowrap mt-2 sm:mt-0 pt-3 sm:pt-4 border-t border-slate-100 sm:border-t-0">
                                                        <span className="sm:hidden font-bold text-[11px] uppercase tracking-widest text-slate-400">Status</span>
                                                        {payment.status === 'completed' ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-[#E8F8EE] text-[#05A660] text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                                <span className="w-1.5 h-1.5 bg-[#05A660] rounded-full"></span>
                                                                Success
                                                            </span>
                                                        ) : payment.status === 'pending' ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                                                Pending
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200">
                                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                                                Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
