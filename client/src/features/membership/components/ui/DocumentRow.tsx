import React, { useRef, useState } from 'react';
import { ExternalLink, Upload, Loader2, FileImage } from 'lucide-react';

interface DocumentRowProps {
    title: string;
    date?: string;
    icon: React.ReactNode;
    status?: string;
    url?: string;
    type?: string;
    onUpload?: (type: string, file: File) => Promise<boolean>;
}

export function DocumentRow({ title, date, icon, status, url, type, onUpload }: DocumentRowProps) {
    const isPlaceholder = url?.includes('placeholder.com') || url?.includes('placeholder.cloud');
    const isMissing = status === 'missing' || !url || isPlaceholder;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !type || !onUpload) return;

        setIsUploading(true);
        const success = await onUpload(type, file);
        setIsUploading(false);

        if (!success && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${isMissing ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white border ${isMissing ? 'border-rose-100' : 'border-slate-200'}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-700">{title}</h4>
                    {isMissing ? (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">● MISSING</p>
                    ) : (
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Uploaded {date || 'N/A'}</p>
                    )}
                </div>
            </div>
            {isMissing ? (
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block px-3 py-1 bg-rose-100/50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">Required</span>
                    {onUpload && type && (
                        <>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isUploading ? 'Uploading' : 'Upload'}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                >
                    View <span className="hidden sm:inline">Full Size</span> <ExternalLink size={10} />
                </a>
            )}
        </div>
    );
}
