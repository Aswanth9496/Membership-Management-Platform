import React from 'react';
import { Clock, Trash2, AlertCircle } from 'lucide-react';

interface AlertBannersProps {
    hasPendingRequest: boolean;
    isRejected: boolean;
    changeStatus: any;
    handleCancelRequest: () => void;
}

export function AlertBanners({ hasPendingRequest, isRejected, changeStatus, handleCancelRequest }: AlertBannersProps) {
    return (
        <>
            {hasPendingRequest && (
                <div className="mb-6 bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl text-slate-500 shadow-sm border border-slate-100 shrink-0">
                            <Clock size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Profile Update Pending</h3>
                            <p className="text-slate-700 text-xs mt-0.5 font-medium">Your requested changes are under review by an administrator. Editing is temporarily disabled.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancelRequest}
                        className="mt-4 sm:mt-0 w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-2 block"
                    >
                        <Trash2 size={14} /> Cancel Request
                    </button>
                </div>
            )}

            {isRejected && (
                <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start sm:items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="bg-white p-2.5 rounded-xl text-rose-500 shadow-sm border border-rose-100 shrink-0">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-rose-900 text-sm tracking-tight">Update Request Rejected</h3>
                        <p className="text-rose-700 text-xs mt-0.5 font-medium flex gap-1">
                            <span className="font-bold">Reason:</span> {changeStatus?.lastRequest?.rejectionReason || 'Please contact support for more information.'}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
