import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import {
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    ShieldAlert,
    CreditCard,
    AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';
import { useAppSelector } from '../../store/hooks';

export default function MemberCertificate() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state: any) => state.auth);
    const { isProcessing, handlePayment } = useRazorpayPayment();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/member/profile');
            setProfile(response.data.data.member || response.data.data.user);
        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error', 'Could not load your certificate details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleDownload = async () => {
        if (!isApproved) {
            Swal.fire('Not Available', 'Certificate is available only for approved members.', 'warning');
            return;
        }

        try {
            setDownloading(true);

            const response = await api.get('/api/member/profile/certificate/download', {
                responseType: 'blob'
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = fileURL;
            a.download = `Membership_Certificate.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(fileURL);

        } catch (error) {
            console.error(error);
            Swal.fire('Download Failed', 'Failed to retrieve the certificate securely.', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleRenew = () => {
        handlePayment({
            user,
            onSuccess: () => {
                fetchProfile(); // Refresh the active certificate state dynamically
            }
        });
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const { status, certificate } = profile || {};
    const isApproved = status === 'approved';
    const isVerified = status === 'verified';

    const expiryDate = certificate?.expiryDate ? new Date(certificate.expiryDate) : null;
    const now = new Date();

    const isExpired = expiryDate && expiryDate < now;
    const isNearExpiry = expiryDate && (expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) && !isExpired; // Within 30 days

    // State resolving for UI
    let CertificateIcon = CheckCircle2;
    let certTitle = 'Certificate Available';
    let certBg = 'bg-[#E8F8EE]';
    let certBorder = 'border-emerald-100';
    let certIconColor = 'text-[#05A660]';

    if (status === 'submitted') {
        CertificateIcon = ShieldAlert;
        certTitle = 'Restricted Access';
        certBg = 'bg-slate-50';
        certBorder = 'border-slate-200';
        certIconColor = 'text-slate-400';
    } else if (status === 'verified') {
        CertificateIcon = AlertCircle;
        certTitle = 'Pending Payment';
        certBg = 'bg-amber-50';
        certBorder = 'border-amber-100';
        certIconColor = 'text-amber-500';
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-sans text-slate-900 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <p className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase mb-2">My Documents</p>
                    <h1 className="text-[32px] sm:text-[40px] leading-none font-extrabold tracking-tight text-slate-900">
                        Certificate Hub
                    </h1>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${status === 'approved' ? 'bg-[#E8F8EE] border-emerald-100' :
                        status === 'verified' ? 'bg-amber-50 border-amber-100' :
                            'bg-slate-50 border-slate-200'
                        }`}>
                        {status === 'approved' ? (
                            <CheckCircle2 className="text-[#05A660]" size={20} fill="currentColor" stroke="white" strokeWidth={1} />
                        ) : status === 'verified' ? (
                            <AlertCircle className="text-amber-500" size={18} />
                        ) : (
                            <ShieldAlert className="text-slate-400" size={18} />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Eligibility</p>
                        <p className="text-[14px] font-bold text-slate-900 leading-none mt-1">
                            {status === 'approved' ? 'Approved Member' :
                                status === 'verified' ? 'Pending Payment' :
                                    'Requires Approval'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Certificate Card */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className={`p-2.5 rounded-xl border shadow-sm shrink-0 ${certBg} ${certBorder} ${certIconColor}`}>
                            <CertificateIcon size={18} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-[16px] text-[#0B1221]">Membership Certificate</h3>
                            <p className="text-[12px] font-bold text-slate-400 mt-0.5">{certTitle}</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {status === 'submitted' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-6">
                                <ShieldAlert size={48} className="text-slate-300 mb-4" />
                                <h4 className="text-sm font-bold text-slate-600 mb-2">Awaiting Admin Verification</h4>
                                <p className="text-xs text-slate-500 font-medium max-w-[250px]">
                                    Certificate is available only for fully approved and active members.
                                </p>
                            </div>
                        ) : status === 'verified' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-6">
                                <AlertCircle size={48} className="text-amber-300 mb-4" />
                                <h4 className="text-sm font-bold text-slate-600 mb-2">Pending Payment</h4>
                                <p className="text-xs text-slate-500 font-medium max-w-[250px] mb-5">
                                    Your membership is verified. Please complete payment to activate and generate certificate.
                                </p>
                                <button
                                    onClick={handleRenew}
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-amber-200 disabled:opacity-70"
                                >
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Complete Membership Payment
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Issue Date</p>
                                        <p className="text-[15px] text-slate-800 font-bold">
                                            {certificate?.issueDate ? new Date(certificate.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Expiry Date</p>
                                        <p className={`text-[15px] font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {certificate?.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl text-[13px] font-bold hover:bg-slate-700 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={18} />}
                                        {downloading ? 'Encrypting & Downloading...' : 'Download Certificate E-Copy'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Renewal Card */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-[#fff1f2] border border-rose-100 p-2.5 rounded-xl text-rose-500 shadow-sm shrink-0">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-[16px] text-[#0B1221]">Membership Renewal</h3>
                            <p className="text-[12px] font-bold text-slate-400 mt-0.5">Manage Subscription Timelines</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {status === 'submitted' ? (
                            <div className="text-center py-6">
                                <p className="text-sm font-bold text-slate-600 mb-1">Awaiting Initial Approval</p>
                                <p className="text-xs text-slate-500 font-medium">You must complete your initial registration cycle before accessing the renewal terminal.</p>
                            </div>
                        ) : status === 'verified' ? (
                            <div className="text-center py-6">
                                <p className="text-sm font-bold text-slate-600 mb-1">Awaiting Activation</p>
                                <p className="text-xs text-slate-500 font-medium">Please finalize your onboarding payment to activate your membership timelines.</p>
                            </div>
                        ) : isExpired ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                                <AlertCircle size={32} className="text-rose-500 mb-3" />
                                <h4 className="text-[15px] font-extrabold text-rose-900 tracking-tight mb-2">Membership Expired</h4>
                                <p className="text-[13px] text-rose-700 font-medium mb-5 px-4">Your current membership cycle has concluded. Reactivate your dashboard functionalities by renewing.</p>
                                <button
                                    onClick={handleRenew}
                                    disabled={isProcessing}
                                    className="px-6 py-3 flex items-center justify-center gap-2 bg-rose-600 text-white rounded-xl text-[13px] font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-200 w-full disabled:opacity-70"
                                >
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Renew Membership Now
                                </button>
                            </div>
                        ) : isNearExpiry ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                                <AlertTriangle size={32} className="text-amber-500 mb-3" />
                                <h4 className="text-[15px] font-extrabold text-amber-900 tracking-tight mb-2">Renew Soon</h4>
                                <p className="text-[13px] text-amber-700 font-medium mb-5 px-4">Your membership is approaching expiration. Ensure uninterrupted access by preparing to renew.</p>
                                <button
                                    onClick={handleRenew}
                                    disabled={isProcessing}
                                    className="px-6 py-3 flex items-center justify-center gap-2 bg-amber-500 text-white rounded-xl text-[13px] font-bold hover:bg-amber-600 transition-all shadow-sm shadow-amber-200 w-full disabled:opacity-70"
                                >
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Renew Subscription
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 bg-[#E8F8EE] border border-emerald-100 rounded-2xl text-center h-full">
                                <CheckCircle2 size={36} className="text-[#05A660] mb-3" />
                                <h4 className="text-[15px] font-extrabold text-emerald-900 tracking-tight mb-2">Membership Active</h4>
                                <p className="text-[13px] text-emerald-700 font-medium px-4">Your current subscription is completely active and in good standing. No billing actions required.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
