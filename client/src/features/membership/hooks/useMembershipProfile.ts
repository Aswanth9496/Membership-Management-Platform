import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api/axios';
import Swal from 'sweetalert2';

export function useMembershipProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [changeStatus, setChangeStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editData, setEditData] = useState<any>({});

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, statusRes] = await Promise.all([
                api.get('/api/member/profile'),
                api.get('/api/member/profile/change-status').catch(() => ({ data: { data: null } }))
            ]);
            setProfile(profileRes.data.data.member || profileRes.data.data.user);
            setChangeStatus(statusRes.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error', 'Could not load your profile details.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const startEditing = (section: string) => {
        setEditingSection(section);
        if (section === 'personal') {
            setEditData({
                fullName: profile?.member?.fullName || '',
                mobile: profile?.member?.mobile || '',
                landline: profile?.member?.landline || '',
                dateOfBirth: profile?.member?.dateOfBirth ? new Date(profile.member.dateOfBirth).toISOString().split('T')[0] : '',
                roleInAgency: profile?.member?.roleInAgency || '',
                officeType: profile?.member?.officeType || ''
            });
        } else if (section === 'establishment') {
            setEditData({
                establishmentName: profile?.establishment?.name || '',
                tradeName: profile?.establishment?.tradeName || '',
                officialClassification: profile?.establishment?.officialClassification || '',
                businessType: profile?.establishment?.businessType || '',
                yearOfEstablishment: profile?.establishment?.yearOfEstablishment || '',
                organizationalStatus: profile?.establishment?.organizationalStatus || '',
                officialEmail: profile?.establishment?.officialEmail || '',
                website: profile?.establishment?.website || ''
            });
        } else if (section === 'location') {
            setEditData({
                registeredAddress: profile?.location?.registeredAddress || '',
                city: profile?.location?.city || '',
                district: profile?.location?.district || '',
                region: profile?.location?.region || '',
                pinCode: profile?.location?.pinCode || profile?.location?.pincode || '',
            });
        }
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setEditData({});
    };

    const handleEditChange = (field: string, value: string) => {
        setEditData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmitUpdate = async (section: string) => {
        try {
            setSubmitting(true);

            let requestedChanges: any = {};
            if (section === 'personal') {
                requestedChanges = {
                    member: {
                        fullName: editData.fullName,
                        mobile: editData.mobile,
                        landline: editData.landline,
                        dateOfBirth: editData.dateOfBirth,
                        roleInAgency: editData.roleInAgency,
                        officeType: editData.officeType
                    }
                };
            } else if (section === 'establishment') {
                requestedChanges = {
                    establishment: {
                        name: editData.establishmentName,
                        tradeName: editData.tradeName,
                        officialClassification: editData.officialClassification,
                        businessType: editData.businessType,
                        yearOfEstablishment: editData.yearOfEstablishment,
                        organizationalStatus: editData.organizationalStatus,
                        officialEmail: editData.officialEmail,
                        website: editData.website
                    }
                };
            } else if (section === 'location') {
                requestedChanges = {
                    location: {
                        registeredAddress: editData.registeredAddress,
                        city: editData.city,
                        district: editData.district,
                        region: editData.region,
                        pinCode: editData.pinCode
                    }
                };
            }

            await api.post('/api/member/profile/request-update', { requestedChanges });

            Swal.fire('Request Submitted', 'Your profile update request has been submitted and is awaiting admin approval.', 'success');
            setEditingSection(null);
            fetchAllData();
        } catch (error: any) {
            Swal.fire('Update Failed', error.response?.data?.message || 'No actual changes detected.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        try {
            const result = await Swal.fire({
                title: 'Cancel Request?',
                text: "Are you sure you want to cancel your pending update request?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f43f5e',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Yes, cancel it'
            });

            if (result.isConfirmed) {
                setLoading(true);
                await api.delete('/api/member/profile/cancel-request');
                Swal.fire('Cancelled', 'Your update request has been cancelled.', 'success');
                fetchAllData();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to cancel request.', 'error');
            setLoading(false);
        }
    };

    const handleUploadDocument = async (documentType: string, file: File) => {
        try {
            // Validation
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire('Error', 'File exceeds 2MB limit.', 'error');
                return false;
            }

            const formData = new FormData();
            formData.append('documentType', documentType);
            formData.append('document', file);

            await api.post('/api/member/profile/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            await fetchAllData();
            Swal.fire({
                title: 'Uploaded!',
                text: 'Your document has been verified successfully.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            return true;
        } catch (error: any) {
            Swal.fire('Upload Failed', error.response?.data?.message || 'Could not upload document.', 'error');
            return false;
        }
    };

    return {
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
    };
}
