import React, { useState, useEffect, useMemo } from 'react';
import {
    Eye,
    Download,
    CreditCard,
    DollarSign,
    CheckCircle,
    Clock
} from 'lucide-react';
import api from '../../services/api/axios';
import MySwal from '../../utils/swal';
import { CSVLink } from 'react-csv';

interface Transaction {
    id: string; // from reg._id
    transactionId: string;
    eventName: string;
    participantName: string;
    email: string;
    phoneNumber: string;
    amountPaid: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: string;
    registrationId: string;
    eventId: string;
    orderId: string;
}

export default function Payments() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Ensure we fetch the transactions on mount
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/admin/payments');
                setTransactions(response.data.data || []);
            } catch (err) {
                MySwal.fire('Error', 'Failed to fetch payment data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    // Summary stats
    const stats = useMemo(() => {
        return {
            totalRevenue: transactions.filter(t => t.paymentStatus === 'completed').reduce((sum, t) => sum + t.amountPaid, 0),
            totalTransactions: transactions.length,
            successful: transactions.filter(t => t.paymentStatus === 'completed').length,
            pending: transactions.filter(t => t.paymentStatus === 'pending').length,
            refundedFailed: transactions.filter(t => t.paymentStatus === 'failed' || t.paymentStatus === 'refunded').length,
        };
    }, [transactions]);

    const handleViewDetails = (t: Transaction) => {
        MySwal.fire({
            title: `<span class="italic text-slate-800 font-extrabold tracking-tight">Transaction Details</span>`,
            html: `
                <div class="text-left text-sm flex flex-col gap-3 font-medium text-slate-600 mt-2 bg-slate-50 p-6 rounded-2xl ring-1 ring-slate-100">
                    <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Transaction ID</span> <span class="text-slate-900 font-bold">${t.transactionId}</span></div>
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Status</span> ${getStatusBadgeHTML(t.paymentStatus)}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Participant</span> <span class="text-slate-900 font-bold break-words">${t.participantName}</span><br/><span class="text-xs text-slate-500">${t.email}<br/>${t.phoneNumber}</span></div>
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Event</span> <span class="text-slate-900 font-bold">${t.eventName}</span></div>
                    </div>
                    <div class="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Amount</span> <span class="text-slate-900 font-bold tracking-tight text-lg">₹${t.amountPaid}</span></div>
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Date</span> <span class="text-slate-900 font-bold">${new Date(t.paymentDate).toLocaleDateString()}</span></div>
                        <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Method</span> <span class="text-slate-900 font-bold">${t.paymentMethod}</span></div>
                    </div>
                    <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Order ID</span> <span class="text-slate-500 font-mono text-xs">${t.orderId}</span></div>
                </div>
            `,
            width: '600px',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Close Details',
            customClass: {
                htmlContainer: 'p-0 text-left',
                title: 'p-5 pt-8 text-2xl text-left'
            }
        });
    };

    const getStatusBadgeHTML = (status: string) => {
        status = status.toLowerCase();
        let classes = '';
        if (status === 'completed') classes = 'bg-emerald-50 text-emerald-600 ring-emerald-200';
        else if (status === 'pending') classes = 'bg-amber-50 text-amber-600 ring-amber-200';
        else classes = 'bg-rose-50 text-rose-600 ring-rose-200';

        return `<span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest ring-1 ring-inset ${classes}">${status}</span>`;
    };

    const getStatusBadgeClass = (status: string) => {
        status = status.toLowerCase();
        if (status === 'completed') return 'bg-emerald-50 text-emerald-600 ring-emerald-200';
        if (status === 'pending') return 'bg-amber-50 text-amber-600 ring-amber-200 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
        return 'bg-rose-50 text-rose-600 ring-rose-200';
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight italic text-primary">Payments / Transactions</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 font-medium italic">Monitor all event registration payments.</p>
                </div>
                {/* Export Button */}
                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <CSVLink
                        data={transactions}
                        filename="admin-payments-export.csv"
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        <Download size={16} /> Export to CSV
                    </CSVLink>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/50">
                        <DollarSign size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">₹{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/50">
                        <CreditCard size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalTransactions}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                        <CheckCircle size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Successful</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.successful}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/50">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.pending}</div>
                    </div>
                </div>
            </div>



            {/* List/Table view */}
            <div className="flex flex-col w-full pb-8">
                {/* Desktop view */}
                <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Transaction Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Participant</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Event</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Amount / Method</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right leading-relaxed">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-20 text-slate-400 italic font-medium">Loading payments...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm">
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="font-mono text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors tracking-tight uppercase">{tx.transactionId}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                {new Date(tx.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-700 max-w-[150px] truncate" title={tx.participantName}>{tx.participantName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]" title={tx.email}>{tx.email}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{tx.phoneNumber}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-700 max-w-[150px] truncate" title={tx.eventName}>{tx.eventName}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">₹{tx.amountPaid}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{tx.paymentMethod}</div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusBadgeClass(tx.paymentStatus)}`}>
                                                {tx.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button onClick={() => handleViewDetails(tx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden flex flex-col gap-4 w-full">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 italic font-medium">Loading payments...</div>
                    ) : transactions.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
                            <p className="text-slate-400 text-sm">No transactions found.</p>
                        </div>
                    ) : transactions.map(tx => (
                        <div key={tx.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:border-blue-200">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <div className="font-mono text-xs font-bold text-slate-700 uppercase leading-snug">{tx.transactionId}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">{tx.eventName}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-inset shrink-0 ${getStatusBadgeClass(tx.paymentStatus)}`}>
                                    {tx.paymentStatus}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <div>
                                    <div className="text-sm font-bold text-slate-700">{tx.participantName}</div>
                                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{tx.email}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">{tx.phoneNumber}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-slate-900 tracking-tight">₹{tx.amountPaid}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase">{tx.paymentMethod}</div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(tx.paymentDate).toLocaleDateString()}
                                </div>
                                <button onClick={() => handleViewDetails(tx)} className="p-2 -mr-2 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center transition-colors">
                                    <Eye size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
