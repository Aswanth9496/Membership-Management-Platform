import React from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DataField } from '../ui/DataField';

interface LocationDetailsCardProps {
    location: any;
    isEditing: boolean;
    editData: any;
    submitting: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onChange: (key: string, value: string) => void;
    hasPendingRequest: boolean;
}

export function LocationDetailsCard({
    location,
    isEditing,
    editData,
    submitting,
    onEdit,
    onCancel,
    onSave,
    onChange,
    hasPendingRequest
}: LocationDetailsCardProps) {

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
            title="Location Information"
            icon={<MapPin size={18} />}
            onEdit={onEdit}
            isEditing={isEditing}
            hasPendingRequest={hasPendingRequest}
            editActionArea={editActions}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-5">
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Primary Address" value={location?.registeredAddress} isTextarea isEditing={isEditing} editKey="registeredAddress" editData={editData} handleEditChange={onChange} />
                </div>
                <DataField label="City" value={location?.city} isEditing={isEditing} editKey="city" editData={editData} handleEditChange={onChange} />
                <DataField label="Region" value={location?.region} isEditing={isEditing} editKey="region" editData={editData} handleEditChange={onChange} />
                <DataField label="District" value={location?.district} isEditing={isEditing} editKey="district" editData={editData} handleEditChange={onChange} />
                <DataField label="Pin Code" value={location?.pinCode || location?.pincode} isEditing={isEditing} editKey="pinCode" editData={editData} handleEditChange={onChange} />

            </div>
        </SectionCard>
    );
}
