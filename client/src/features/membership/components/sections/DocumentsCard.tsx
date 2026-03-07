import React from 'react';
import { ShieldCheck, Upload, FileText } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DocumentRow } from '../ui/DocumentRow';

interface DocumentsCardProps {
    documents: any;
    onUpload?: (documentType: string, file: File) => Promise<boolean>;
}

export function DocumentsCard({ documents, onUpload }: DocumentsCardProps) {
    const renderDocProps = (title: string, doc: any, type: string) => {
        let dateStr = 'N/A';
        if (doc?.uploadedAt) {
            dateStr = new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
        }
        return {
            title,
            type,
            date: dateStr,
            url: doc?.url,
            status: doc?.url ? 'uploaded' : 'missing'
        };
    };

    const agencyProof = renderDocProps("Agency Address Proof", documents?.agencyAddressProof, "agencyAddressProof");
    const shopPhoto = renderDocProps("Shop / Office Photo", documents?.shopPhoto, "shopPhoto");
    const businessCard = renderDocProps("Business Card", documents?.businessCard, "businessCard");

    return (
        <SectionCard
            title="Documents & Verification"
            icon={<ShieldCheck size={18} />}
        >
            <div className="space-y-3">
                <DocumentRow
                    title={agencyProof.title}
                    date={agencyProof.date}
                    icon={<FileText className={agencyProof.status === 'missing' ? "text-rose-500" : "text-slate-500"} />}
                    status={agencyProof.status}
                    url={agencyProof.url}
                    type={agencyProof.type}
                    onUpload={onUpload}
                />
                <DocumentRow
                    title={shopPhoto.title}
                    date={shopPhoto.date}
                    icon={<FileText className={shopPhoto.status === 'missing' ? "text-rose-500" : "text-slate-500"} />}
                    status={shopPhoto.status}
                    url={shopPhoto.url}
                    type={shopPhoto.type}
                    onUpload={onUpload}
                />
                <DocumentRow
                    title={businessCard.title}
                    date={businessCard.date}
                    icon={<FileText className={businessCard.status === 'missing' ? "text-rose-500" : "text-slate-500"} />}
                    status={businessCard.status}
                    url={businessCard.url}
                    type={businessCard.type}
                    onUpload={onUpload}
                />
            </div>
        </SectionCard>
    );
}
