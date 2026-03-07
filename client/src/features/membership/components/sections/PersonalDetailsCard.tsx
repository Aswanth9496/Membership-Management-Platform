import React from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { DataField } from '../ui/DataField';

interface PersonalDetailsCardProps {
    member: any;
    email: string;
    isEditing: boolean;
    editData: any;
    submitting: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onChange: (key: string, value: string) => void;
    hasPendingRequest: boolean;
}

export function PersonalDetailsCard({
    member,
    email,
    isEditing,
    editData,
    submitting,
    onEdit,
    onCancel,
    onSave,
    onChange,
    hasPendingRequest
}: PersonalDetailsCardProps) {

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
            title="Personal Details"
            icon={<User size={18} />}
            onEdit={onEdit}
            isEditing={isEditing}
            hasPendingRequest={hasPendingRequest}
            editActionArea={editActions}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-5">
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Full Name" value={member?.fullName} isEditing={isEditing} editKey="fullName" editData={editData} handleEditChange={onChange} />
                </div>
                <DataField label="Mobile" value={member?.mobile ? `+91 ${member.mobile}` : 'N/A'} isLink={!isEditing} isEditing={isEditing} editKey="mobile" type="tel" editData={editData} handleEditChange={onChange} />
                <DataField label="Landline" value={member?.landline || 'N/A'} isEditing={isEditing} editKey="landline" type="tel" editData={editData} handleEditChange={onChange} />
                <DataField label="Date of Birth" value={member?.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'} isEditing={isEditing} editKey="dateOfBirth" type="date" editData={editData} handleEditChange={onChange} />
                <DataField label="Role" value={member?.roleInAgency} isEditing={isEditing} editKey="roleInAgency" editData={editData} handleEditChange={onChange} />
                <DataField label="Office Type" value={member?.officeType} isEditing={isEditing} editKey="officeType" editData={editData} handleEditChange={onChange} />
                <div className="col-span-1 sm:col-span-2">
                    <DataField label="Official Email" value={email} isLink />
                </div>
            </div>
        </SectionCard>
    );
}
