import React from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DataField } from '../ui/DataField';

interface EstablishmentDetailsCardProps {
    establishment: any;
    isEditing: boolean;
    editData: any;
    submitting: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onChange: (key: string, value: string) => void;
    hasPendingRequest: boolean;
}

export function EstablishmentDetailsCard({
    establishment,
    isEditing,
    editData,
    submitting,
    onEdit,
    onCancel,
    onSave,
    onChange,
    hasPendingRequest
}: EstablishmentDetailsCardProps) {

    const editActions = (
        <>
            <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
            </button>
            <button
                onClick={onSave}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-sm"
            >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
            </button>
        </>
    );

    return (
        <SectionCard
            title="Establishment Details"
            icon={<Building2 size={18} />}
            onEdit={onEdit}
            isEditing={isEditing}
            hasPendingRequest={hasPendingRequest}
            editActionArea={editActions}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-5">
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Business Name" value={establishment?.name} isEditing={isEditing} editKey="establishmentName" editData={editData} handleEditChange={onChange} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Trade Name" value={establishment?.tradeName} isEditing={isEditing} editKey="tradeName" editData={editData} handleEditChange={onChange} />
                </div>
                <DataField label="Est. Year" value={establishment?.yearOfEstablishment} isEditing={isEditing} editKey="yearOfEstablishment" type="number" editData={editData} handleEditChange={onChange} />
                <DataField label="Classification" value={establishment?.officialClassification} isEditing={isEditing} editKey="officialClassification" editData={editData} handleEditChange={onChange} />
                <DataField label="Type" value={establishment?.businessType} isEditing={isEditing} editKey="businessType" editData={editData} handleEditChange={onChange} />
                <DataField label="Status" value="Active" isStatus />
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Website" value={establishment?.website} isLink={!isEditing} isEditing={isEditing} editKey="website" editData={editData} handleEditChange={onChange} />
                </div>
            </div>
        </SectionCard>
    );
}
