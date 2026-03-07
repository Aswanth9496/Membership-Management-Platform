import React from 'react';
import { Edit3, Globe, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderCardProps {
    profile: any;
    member: any;
}

export function HeaderCard({ profile, member }: HeaderCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 text-3xl font-extrabold text-slate-400 uppercase">
                        {member?.fullName ? member.fullName.charAt(0) : '?'}
                    </div>
                    {profile?.status?.toLowerCase() === 'approved' && (
                        <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full border-4 border-white" title="Verified Member">
                            <ShieldCheck size={16} fill="currentColor" className="text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-slate-800">{member?.fullName || 'User Name'}</h1>
                        <span className="bg-slate-50 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-100 whitespace-nowrap">
                            {profile?.status ? profile.status.replace('_', ' ') : 'Pending'}
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm mb-2">{member?.roleInAgency || 'Agency Owner'}</p>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar size={14} />
                        <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Membership Validity & Action Block */}
            <div className="flex flex-col items-center md:items-end gap-2 mt-2 md:mt-0 w-full md:w-auto text-center md:text-right p-4 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Membership Plan</div>

                {(!profile?.certificate?.generated) ? (
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <span className="text-amber-600 font-black bg-amber-50 px-3 py-1 rounded-md border border-amber-200 text-xs flex items-center gap-1.5"><AlertTriangle size={14} /> Pending Payment</span>
                        <Link to="/membership/payments" className="mt-1 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-700 transition-colors">Pay Now</Link>
                    </div>
                ) : (profile?.certificate?.expiryDate && new Date(profile.certificate.expiryDate) < new Date()) ? (
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <span className="text-rose-600 font-black bg-rose-50 px-3 py-1 rounded-md border border-rose-200 text-xs flex items-center gap-1.5">Expired</span>
                        <div className="text-[11px] font-medium text-slate-400 mb-2 mt-1">Expired: <span className="font-bold text-slate-600">{new Date(profile.certificate.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                        <Link to="/membership/payments" className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">Renew Membership</Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 text-xs flex items-center gap-1.5"><ShieldCheck size={14} /> Active</span>
                        <div className="text-[11px] font-medium text-slate-400 mb-2 mt-1">Valid till: <span className="font-bold text-slate-800">{new Date(profile.certificate.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                        <Link to="/membership/certificate" className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[11px] font-bold shadow-sm transition-colors">View Certificate</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
