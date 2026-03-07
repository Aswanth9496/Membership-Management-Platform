import React, { useEffect, useState } from 'react';
import api from '../../services/api/axios';
import { useAppSelector } from '../../store/hooks';
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Calendar,
    CreditCard,
    ArrowDownToLine,
    Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';

export default function Payments() {
    const { user } = useAppSelector((state: any) => state.auth);
    const { isProcessing, handlePayment: triggerRazorpay } = useRazorpayPayment();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLedgerData = async () => {
        try {
            // Fetch Payment Status for Membership
            const statusRes = await api.get('/api/payment/status').catch(() => ({ data: { data: null } }));
            setPaymentStatus(statusRes.data?.data);

            // Fetch Transaction History
            const response = await api.get('/api/payment/transactions').catch(() => ({ data: { data: [] } }));
            setTransactions(response.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch financial data', error);
            Swal.fire('Error', 'Could not load your billing information.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgerData();
    }, []);

    const handlePayment = () => {
        triggerRazorpay({
            user,
            onSuccess: () => {
                fetchLedgerData();
            }
        });
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const normalized = status?.toLowerCase();
        if (normalized === 'success' || normalized === 'completed') {
            return (
                <span className="inline-flex items-center gap-1.5 bg-[#E8F8EE] text-[#05A660] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-[#05A660] rounded-full"></span>
                    Success
                </span>
            );
        } else if (normalized === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    Pending
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    Failed
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-64 items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm text-slate-500 font-medium">Retrieving financial ledger...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-sans text-slate-900 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <p className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase mb-2">Billing & Invoices</p>
                    <h1 className="text-[32px] sm:text-[40px] leading-none font-extrabold tracking-tight text-slate-900">
                        Payment History
                    </h1>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Receipt className="text-primary" size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Records</p>
                        <p className="text-[14px] font-bold text-slate-900 leading-none mt-1">
                            {transactions.length} Transactions
                        </p>
                    </div>
                </div>
            </div>

            {/* Membership Payment Action Card */}
            {(paymentStatus?.showButton || paymentStatus?.showPaymentButton) && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-slate-900/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                                {paymentStatus.paymentType === 'renewal' ? 'Renewal Due' : 'Pending Activation'}
                            </span>
                            {paymentStatus.certificateStatus === 'expired' && (
                                <span className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-rose-500/30">
                                    Expired
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">
                            {paymentStatus.alert || (paymentStatus.paymentType === 'renewal' ? 'Renew Your Membership' : 'Activate Your Membership')}
                        </h2>
                        <p className="text-slate-400 text-sm max-w-md font-medium">
                            Complete your membership payment of <strong className="text-white">₹{paymentStatus.amount?.totalAmount?.toLocaleString() || '3,540'}</strong> to activate your annual subscription and unlock full platform access.
                        </p>
                    </div>
                    <div className="relative z-10 w-full md:w-auto shrink-0 flex items-center justify-center">
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full md:w-auto bg-primary hover:bg-white hover:text-slate-900 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                            {paymentStatus.buttonText || 'Complete Membership Payment'}
                        </button>
                    </div>
                </div>
            )}

            {/* Filter / Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96 flex items-center group">
                    <Search className="absolute left-4 text-slate-400 group-focus-within:text-slate-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Transaction ID or Description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-1000/10 rounded-xl text-[14px] font-medium w-full transition-all outline-none text-slate-800 placeholder:text-slate-400"
                    />
                </div>

                {transactions.length > 0 && (
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-bold transition-colors">
                        <ArrowDownToLine size={16} />
                        Export Ledger
                    </button>
                )}
            </div>

            {/* Main Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse block lg:table">
                        <thead className="hidden lg:table-header-group bg-slate-50/50">
                            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-500">
                                <th className="py-5 px-6 font-bold whitespace-nowrap">Transaction ID</th>
                                <th className="py-5 px-6 font-bold whitespace-nowrap">User Details</th>
                                <th className="py-5 px-6 font-bold whitespace-nowrap">Amount</th>
                                <th className="py-5 px-6 font-bold whitespace-nowrap">Status</th>
                                <th className="py-5 px-6 font-bold whitespace-nowrap">Payment Method</th>
                                <th className="py-5 px-6 font-bold whitespace-nowrap">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="text-[14px] block lg:table-row-group">
                            {transactions.length === 0 ? (
                                <tr className="block lg:table-row">
                                    <td colSpan={6} className="py-20 px-6 text-center block lg:table-cell">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                                                <Receipt size={32} className="text-slate-400" />
                                            </div>
                                            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight mb-2">No Transactions Found</h3>
                                            <p className="text-[14px] text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                                Your payment ledger is currently empty. Once you complete a transaction, it will be securely archived here.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr className="block lg:table-row">
                                    <td colSpan={6} className="py-16 px-6 text-center block lg:table-cell">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search size={32} className="text-slate-300 mb-4" />
                                            <p className="text-[15px] font-bold text-slate-700">No results found for "{searchTerm}"</p>
                                            <p className="text-[13px] text-slate-500 mt-1">Try adjusting your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx, idx) => (
                                    <tr key={tx.id || idx} className="block lg:table-row border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors p-6 lg:p-0">

                                        {/* Transaction ID */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6 mb-3 lg:mb-0">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Transaction ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                                    {tx.transactionId || `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`}
                                                </span>
                                            </div>
                                        </td>

                                        {/* User Details */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6 mb-3 lg:mb-0">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">User Details</span>
                                            <div>
                                                <p className="font-bold text-slate-900 text-[14px] leading-tight flex items-center gap-2">
                                                    {tx.userName || user?.name || 'Unknown User'}
                                                </p>
                                                <p className="text-[12px] font-medium text-slate-400 mt-0.5 truncate max-w-[200px]" title={tx.email || user?.email}>
                                                    {tx.email || user?.email || 'No email attached'}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6 mb-3 lg:mb-0">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Amount</span>
                                            <span className="font-black text-slate-900 text-[15px]">
                                                ₹{tx.amount?.toLocaleString() || '0'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6 mb-3 lg:mb-0">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Status</span>
                                            <div>{getStatusBadge(tx.status || 'success')}</div>
                                        </td>

                                        {/* Payment Method */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6 mb-3 lg:mb-0">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Payment Method</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-6 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0">
                                                    <CreditCard size={14} className="text-slate-400" />
                                                </div>
                                                <span className="font-bold text-slate-700 text-[13px] capitalize">
                                                    {tx.paymentMethod || 'Razorpay'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Date & Time */}
                                        <td className="flex flex-col lg:table-cell py-3 lg:py-5 px-0 lg:px-6">
                                            <span className="lg:hidden font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Date & Time</span>
                                            <div>
                                                <p className="font-bold text-slate-800 text-[13px] whitespace-nowrap flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1.5">
                                                    <Clock size={11} className="text-slate-300" />
                                                    {tx.date ? new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
