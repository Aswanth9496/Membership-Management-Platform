import React, { ReactNode } from 'react';
import { Edit3 } from 'lucide-react';

interface SectionCardProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    onEdit?: () => void;
    customAction?: ReactNode;
    isEditing?: boolean;
    hasPendingRequest?: boolean;
    editActionArea?: ReactNode;
}

export function SectionCard({
    title,
    icon,
    onEdit,
    children,
    customAction,
    isEditing = false,
    hasPendingRequest = false,
    editActionArea
}: SectionCardProps) {
    return (
        <div className={`bg-white rounded-3xl border ${isEditing ? 'border-slate-200 shadow-md ring-4 ring-slate-100' : 'border-slate-200 shadow-sm hover:border-slate-300'} overflow-hidden flex flex-col h-full transition-all duration-300`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${isEditing ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center gap-3 text-slate-800 font-bold">
                    <span className="text-primary">{icon}</span>
                    <h3 className="text-[13px] uppercase tracking-wider">{title}</h3>
                </div>
                {customAction ? customAction : (
                    !hasPendingRequest && !isEditing && onEdit && (
                        <button onClick={onEdit} className="text-slate-400 hover:text-primary bg-white shadow-sm border border-slate-200 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 hover:bg-slate-50">
                            <Edit3 size={12} /> Edit
                        </button>
                    )
                )}
            </div>
            <div className="p-6 flex-1">
                {children}
            </div>
            {isEditing && editActionArea && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl">
                    {editActionArea}
                </div>
            )}
        </div>
    );
}
