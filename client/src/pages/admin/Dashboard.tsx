import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import {
    TrendingDown,
    Building2,
    Clock,
    Calendar,
    CheckCircle,
    Users,
    Banknote
} from 'lucide-react';

export const Dashboard = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [rawStats, setRawStats] = useState<any>(null);
    const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/admin/dashboard');
                const { stats: apiStats, members } = response.data.data;

                // Map API stats to dashboard format
                const mappedStats = [
                    { title: 'Total Agencies', value: (apiStats?.totalMembers || 0).toString(), icon: <Building2 size={20} />, color: 'blue' },
                    { title: 'Active Members', value: (apiStats?.activeMembers || 0).toString(), icon: <CheckCircle size={20} />, color: 'emerald' },
                    { title: 'Pending Approval', value: (apiStats?.pendingMembers || 0).toString(), icon: <Clock size={20} />, color: 'amber' },
                    { title: 'Total Revenue', value: '₹' + (apiStats?.totalRevenue || 0).toLocaleString(), icon: <Banknote size={20} />, color: 'emerald' },
                    { title: 'Total Events', value: (apiStats?.totalEvents || 0).toString(), icon: <Calendar size={20} />, color: 'indigo' },
                    { title: 'Event Registrations', value: (apiStats?.totalRegistrations || 0).toString(), icon: <Users size={20} />, color: 'violet' },
                    { title: 'Rejected', value: (apiStats?.rejectedMembers || 0).toString(), icon: <TrendingDown size={20} />, color: 'rose' },
                ];

                // Map members to recent registrations table
                const mappedMembers = (members || []).slice(0, 5).map((m: any) => ({
                    name: m.name || m.member?.fullName || m.fullName || 'N/A',
                    agency: m.company || m.establishment?.name || m.agencyName || 'N/A',
                    date: new Date(m.registrationDate || m.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                    status: m.membershipStatus || m.status || 'Unknown'
                }));

                setStats(mappedStats);
                setRawStats(apiStats);
                setRecentRegistrations(mappedMembers);
            } catch (err: any) {
                console.error("Dashboard fetch error:", err);
                setError("Platform insight sync failed.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getBadgeClasses = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'verified':
                return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
            case 'submitted':
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
            case 'review':
                return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 ring-1 ring-red-200';
            default:
                return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
        }
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0">
            {/* Header Removed */}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {loading ? (
                    [...Array(7)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-6 h-32 animate-pulse">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4"></div>
                            <div className="w-24 h-4 bg-slate-50 rounded mb-2"></div>
                            <div className="w-16 h-8 bg-slate-50 rounded"></div>
                        </div>
                    ))
                ) : (
                    stats.map((stat, index) => (
                        <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group" key={index}>
                            <div className={`p-2 w-fit rounded-xl mb-3 md:mb-4 bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                {stat.icon}
                            </div>
                            <span className="text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 truncate">{stat.title}</span>
                            <div className="flex items-end justify-between">
                                <span className="text-xl md:text-2xl font-black text-slate-900 leading-none tracking-tight">{stat.value}</span>
                                <span className={`flex items-center text-[9px] md:text-[10px] font-bold text-emerald-600`}>
                                    Real-time
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 md:gap-8 mb-8 md:mb-0">
                {/* Recent Registrations Table */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 bg-slate-50/30">
                        <span className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Recent Agency Applications</span>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrant</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium italic">Handshaking with platform server...</td>
                                    </tr>
                                ) : recentRegistrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                                    <Building2 size={24} className="opacity-50" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No recent registrations</h3>
                                                <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                                                    {error || "When new travel agencies submit their applications, they will securely appear here."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentRegistrations.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                                        {(row.name || 'N A').split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{row.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 truncate max-w-[200px]">{row.agency}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-tight">{row.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getBadgeClasses(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col w-full divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 font-medium italic text-sm">Handshaking with platform server...</div>
                        ) : recentRegistrations.length === 0 ? (
                            <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-1">
                                    <Building2 size={24} className="opacity-50" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No recent registrations</h3>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                                    {error || "When new travel agencies submit their applications, they will securely appear here."}
                                </p>
                            </div>
                        ) : (
                            recentRegistrations.map((row, i) => (
                                <div key={i} className="flex flex-col p-5 hover:bg-slate-50/50 transition-colors gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase flex-shrink-0 border border-slate-200/50 shadow-sm">
                                                {(row.name || 'N A').split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                                            </div>
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <span className="text-sm font-bold text-slate-700 truncate leading-tight">{row.name}</span>
                                                <span className="text-xs font-semibold text-slate-500 truncate mt-0.5">{row.agency}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${getBadgeClasses(row.status)}`}>
                                            {row.status}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                            <Calendar size={11} className="text-slate-400" /> {row.date}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
