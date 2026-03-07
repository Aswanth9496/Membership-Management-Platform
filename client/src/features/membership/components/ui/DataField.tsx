import React from 'react';

interface DataFieldProps {
    label: string;
    value: string | undefined | null;
    isLink?: boolean;
    isStatus?: boolean;
    editKey?: string;
    section?: string;
    type?: string;
    isTextarea?: boolean;
    isEditing?: boolean;
    editData?: any;
    handleEditChange?: (key: string, value: string) => void;
}

export function DataField({
    label,
    value,
    isLink,
    isStatus,
    editKey,
    section,
    type = 'text',
    isTextarea = false,
    isEditing = false,
    editData = {},
    handleEditChange
}: DataFieldProps) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            {isEditing && editKey && handleEditChange ? (
                isTextarea ? (
                    <textarea
                        value={editData[editKey] || ''}
                        onChange={(e) => handleEditChange(editKey, e.target.value)}
                        className="w-full text-sm font-semibold text-slate-900 border border-slate-200 bg-slate-50/50 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none transition-all"
                        placeholder={`Enter ${label}`}
                    />
                ) : (
                    <input
                        type={type}
                        value={editData[editKey] || ''}
                        onChange={(e) => handleEditChange(editKey, e.target.value)}
                        className="w-full text-sm font-semibold text-slate-900 border border-slate-200 bg-slate-50/50 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder={`Enter ${label}`}
                    />
                )
            ) : isStatus ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {value || 'Active'}
                </div>
            ) : (
                <p className={`text-sm font-semibold ${isLink ? 'text-primary cursor-pointer hover:underline break-words' : 'text-slate-800 break-words'}`}>
                    {value || '—'}
                </p>
            )}
        </div>
    );
}
