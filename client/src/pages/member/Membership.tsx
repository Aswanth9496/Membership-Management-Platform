import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useMembershipProfile } from '../../features/membership/hooks/useMembershipProfile';
import { AlertBanners } from '../../features/membership/components/ui/AlertBanners';
import { HeaderCard } from '../../features/membership/components/sections/HeaderCard';
import { PersonalDetailsCard } from '../../features/membership/components/sections/PersonalDetailsCard';
import { EstablishmentDetailsCard } from '../../features/membership/components/sections/EstablishmentDetailsCard';
import { LocationDetailsCard } from '../../features/membership/components/sections/LocationDetailsCard';
import { DocumentsCard } from '../../features/membership/components/sections/DocumentsCard';

export default function MembershipDetails() {
    const {
        profile,
        changeStatus,
        loading,
        editingSection,
        submitting,
        editData,
        startEditing,
        cancelEditing,
        handleEditChange,
        handleSubmitUpdate,
        handleCancelRequest,
        handleUploadDocument
    } = useMembershipProfile();

    const hasPendingRequest = changeStatus?.hasPendingRequest;
    const lastRequestStatus = changeStatus?.lastRequest?.status;
    const isRejected = !hasPendingRequest && lastRequestStatus === 'rejected';

    if (loading && !profile) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const { establishment, member, location, email, documents } = profile || {};

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans relative">
            {/* Editing Overlay Lock for pending requests */}
            {hasPendingRequest && (
                <div className="fixed inset-0 z-50 pointer-events-none"></div>
            )}

            <div className="max-w-6xl mx-auto space-y-6">

                {/* Status Banners */}
                <AlertBanners
                    hasPendingRequest={hasPendingRequest}
                    isRejected={isRejected}
                    changeStatus={changeStatus}
                    handleCancelRequest={handleCancelRequest}
                />

                <div className={`transition-opacity duration-300 space-y-6 ${hasPendingRequest ? 'opacity-70 pointer-events-none' : ''}`}>

                    {/* 1. Header Card */}
                    <HeaderCard profile={profile} member={member} />

                    {/* 2. Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Personal Details */}
                        <PersonalDetailsCard
                            member={member}
                            email={email}
                            isEditing={editingSection === 'personal'}
                            editData={editData}
                            submitting={submitting}
                            onEdit={() => startEditing('personal')}
                            onCancel={cancelEditing}
                            onSave={() => handleSubmitUpdate('personal')}
                            onChange={handleEditChange}
                            hasPendingRequest={hasPendingRequest}
                        />

                        {/* Establishment Details */}
                        <EstablishmentDetailsCard
                            establishment={establishment}
                            isEditing={editingSection === 'establishment'}
                            editData={editData}
                            submitting={submitting}
                            onEdit={() => startEditing('establishment')}
                            onCancel={cancelEditing}
                            onSave={() => handleSubmitUpdate('establishment')}
                            onChange={handleEditChange}
                            hasPendingRequest={hasPendingRequest}
                        />

                        {/* Location Information */}
                        <div className="lg:col-span-2">
                            <LocationDetailsCard
                                location={location}
                                isEditing={editingSection === 'location'}
                                editData={editData}
                                submitting={submitting}
                                onEdit={() => startEditing('location')}
                                onCancel={cancelEditing}
                                onSave={() => handleSubmitUpdate('location')}
                                onChange={handleEditChange}
                                hasPendingRequest={hasPendingRequest}
                            />
                        </div>

                        {/* Documents & Verification */}
                        <div className="lg:col-span-2">
                            <DocumentsCard
                                documents={documents}
                                onUpload={handleUploadDocument}
                            />
                        </div>
                    </div>

                    <footer className="pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-slate-400 text-xs gap-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} />
                            <span>All data is verified and encrypted according to compliance standards.</span>
                        </div>
                        <div className="flex gap-6 font-medium">
                            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600">Support Center</a>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}