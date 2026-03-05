import React, { useEffect, useState } from 'react';
import api from '../../services/axios';
import {
    CreditCard,
    Receipt,
    CheckCircle2,
    AlertCircle,
    Clock,
    Download,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Payments() {
    const [paymentData, setPaymentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaymentStatus = async () => {
            try {
                const response = await api.get('/api/payment/status');
                if (response.data.success) {
                    setPaymentData(response.data.data);
                }
            } catch (error: any) {
                console.error('Failed to fetch payment status', error);
                // Don't show error swal here as it might just mean no payment initiated yet
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentStatus();
    }, []);

    const handleInitiatePayment = async () => {
        try {
            Swal.fire({
                title: 'Redirecting to Payment',
                text: 'Please wait while we secure your transaction...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // This would normally call /api/payment/create-order
            // For now we just show the intent
            setTimeout(() => {
                Swal.fire('Information', 'Payment gateway integration in progress. Please contact administrator for direct bank transfer.', 'info');
            }, 1500);

        } catch (error) {
            Swal.fire('Error', 'Failed to initiate payment. Please try again.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-64 items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm text-slate-500 font-medium">Retrieving financial records...</p>
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
                <div className="flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-400 rounded-full mx-auto mb-6">
                    <Receipt size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Payment Records</h3>
                <p className="text-slate-500 mt-3 leading-relaxed">
                    We couldn't find any payment history for your account. If you just made a payment, it might take a few minutes to sync.
                </p>
            </div>
        );
    }

    const {
        memberType,
        paymentRequired,
        certificateStatus,
        amount,
        buttonText,
        certificate,
        alert
    } = paymentData;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Accounts & Billing</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your membership subscriptions and transaction history.</p>
                </div>

                {paymentRequired && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-700 text-sm font-bold animate-pulse">
                        <AlertCircle size={16} />
                        <span>Action Required: Outstanding Dues</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-lg">
                                    <ShieldCheck size={20} />
                                </div>
                                <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Membership Status</h2>
                            </div>
                            <span className={`px - 3 py - 1 rounded - full text - [10px] font - black uppercase tracking - widest ${certificateStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                certificateStatus === 'not_generated' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                                } `}>
                                {certificateStatus?.replace('_', ' ') || 'Pending'}
                            </span>
                        </div>

                        <div className="p-8">
                            {memberType === 'new' && !certificate?.generated ? (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Registration Fee Pending</h3>
                                            <p className="text-sm text-slate-500 mt-1 max-w-md">Your application has been processed. Complete the one-time registration payment to activate your membership and generate your certificate.</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 text-sm">
                                            <span className="text-slate-500 font-medium tracking-tight uppercase text-[10px]">Description</span>
                                            <span className="text-slate-500 font-medium tracking-tight uppercase text-[10px]">Amount (INR)</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 font-semibold italic">Registration Base Fee</span>
                                                <span className="text-slate-900 font-medium">₹{amount?.baseAmount?.toLocaleString() || '0'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 font-semibold italic">GST ({amount?.gstPercent || '0'}%)</span>
                                                <span className="text-slate-900 font-medium">₹{amount?.gstAmount?.toLocaleString() || '0'}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                                                <span className="text-slate-900 font-black text-xs uppercase tracking-widest">Total Payable</span>
                                                <span className="text-2xl font-black text-blue-600 tracking-tighter">₹{amount?.totalAmount?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleInitiatePayment}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-200"
                                    >
                                        <span>{buttonText || 'Pay Registration Fee'}</span>
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate Number</span>
                                            <span className="text-sm font-bold text-slate-900 font-mono tracking-tighter">{certificate?.certificateNumber || 'N/A'}</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validity Remaining</span>
                                            <span className="text-sm font-bold text-slate-900">{certificate?.daysRemaining} Days</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                            <Download size={18} />
                                            <span>Download Certificate</span>
                                        </button>
                                        {paymentData.renewalAvailable && (
                                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                                <Clock size={18} />
                                                <span>Renew Certificate</span>
                                            </button>
                                        )}
                                    </div>

                                    {alert && (
                                        <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                            <Clock size={14} />
                                            {alert}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                <Receipt size={18} />
                            </div>
                            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Recent Transactions</h2>
                        </div>

                        <div className="text-center py-12">
                            <p className="text-slate-400 text-sm font-medium italic">Detailed transaction history is being archived. Contact treasury for formal receipts.</p>
                        </div>
                    </div>
                </div>

                {/* Information Column */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-200">
                        <h3 className="text-lg font-black tracking-tight mb-4">Why pay?</h3>
                        <ul className="space-y-4">
                            {[
                                'Accredited Member Status',
                                'Verification Certificate',
                                'Official TechFinit Badge',
                                'Event Participation Access'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-blue-50">
                                    <CheckCircle2 size={18} className="text-blue-300 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white">
                        <h3 className="text-lg font-black tracking-tight mb-2">Need Help?</h3>
                        <p className="text-slate-400 text-sm mb-6 font-medium">For payment queries or offline bank transfers, reach out to our treasury department.</p>
                        <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
