import React, { useState, useRef, useEffect } from 'react';
import {
    User as UserIcon,
    Mail,
    Lock,
    Building2,
    MapPin,
    Phone,
    Shield,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    FileText,
    Upload,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { registerMemberUser } from '../../features/auth/authThunks';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recovered, setRecovered] = useState(false);

    const fileRefs = {
        agencyAddressProof: useRef<HTMLInputElement>(null),
        shopPhoto: useRef<HTMLInputElement>(null),
    };

    const [formData, setFormData] = useState({
        // Auth
        email: '',
        password: '',
        confirmPassword: '',
        membershipType: 'new',

        // Establishment
        establishment: {
            name: '',
            tradeName: '',
            yearOfEstablishment: '',
            officialClassification: '',
            businessType: '',
            officialEmail: '',
            website: '',
            gstRegistered: false,
            gstNumber: '',
        },

        // Location
        location: {
            district: '',
            region: '',
            city: '',
            pinCode: '',
            registeredAddress: '',
            communicationAddress: '',
            isSameAddress: true,
        },

        // Member
        member: {
            officeType: '',
            roleInAgency: '',
            fullName: '',
            dateOfBirth: '',
            mobile: '',
            landline: '',
        },

        // Partner & Staff (NEW)
        partner: {
            name: '',
            mobile: '',
        },
        staff: {
            name: '',
            mobile: '',
        },

        // Referral (NEW)
        referralCode: '',

        // Document Uploads (NEW)
        documents: {
            agencyAddressProof: { url: '', publicId: '' },
            shopPhoto: { url: '', publicId: '' },
        },
    });

    // Track initialization state
    const isRestored = useRef(false);
    const saveTimeout = useRef<any>(null);

    // 1️⃣ Draft Recovery on Mount (Runs once)
    useEffect(() => {
        if (isRestored.current) return;

        const draft = localStorage.getItem("agencyRegistrationDraft");

        if (draft) {
            try {
                const parsed = JSON.parse(draft);

                const isExpired = parsed.lastSaved && (Date.now() - parsed.lastSaved > 7 * 24 * 60 * 60 * 1000);
                if (!isExpired && parsed.data) {
                    // Restore form state
                    setFormData(prev => {
                        const newState = {
                            ...prev,
                            ...parsed.data,
                            establishment: { ...prev.establishment, ...(parsed.data.establishment || {}) },
                            location: { ...prev.location, ...(parsed.data.location || {}) },
                            member: { ...prev.member, ...(parsed.data.member || {}) },
                            partner: { ...prev.partner, ...(parsed.data.partner || {}) },
                            staff: { ...prev.staff, ...(parsed.data.staff || {}) },
                            documents: prev.documents // Never restore documents
                        };
                        return newState;
                    });

                    if (parsed.step) {
                        setCurrentStep(parsed.step);
                    }

                    setRecovered(true);
                    setTimeout(() => setRecovered(false), 5000);
                } else if (isExpired) {
                    localStorage.removeItem("agencyRegistrationDraft");
                }
            } catch (e) {
                localStorage.removeItem("agencyRegistrationDraft");
            }
        }

        // Delay initialization to avoid racing with the first render's auto-save
        const timer = setTimeout(() => {
            isRestored.current = true;
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // 2️⃣ Auto-save logic (Debounced and Guarded)
    useEffect(() => {
        if (!isRestored.current) return; // Use isRestored as the guard for auto-save

        // Dirty check: Don't save if the form is essentially empty (default state)
        const isDefault = !formData.email && !formData.establishment.name && currentStep === 1;
        if (isDefault) {
            return;
        }

        // Debounce saves to prevent performance lag and race conditions
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            const { documents, ...textOnlyData } = formData;
            const draft = {
                data: textOnlyData,
                step: currentStep,
                lastSaved: Date.now()
            };

            localStorage.setItem("agencyRegistrationDraft", JSON.stringify(draft));
        }, 1000);

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [formData, currentStep]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (error) setError(null);

        // Handle nested fields
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section as keyof typeof prev] as object),
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            // ... (keep current step 1 validations)
            if (!formData.establishment.name) return "Establishment name is required";
            if (!formData.establishment.officialClassification) return "Classification is required";
            if (!formData.establishment.businessType) return "Business type is required";
            if (!formData.establishment.officialEmail) return "Official email is required";
            if (!/^\S+@\S+\.\S+$/.test(formData.establishment.officialEmail)) return "Invalid official email format";
        }
        if (step === 2) {
            if (!formData.location.district) return "District is required";
            if (!formData.location.city) return "City is required";
            if (!/^\d{6}$/.test(formData.location.pinCode)) return "PIN code must be 6 digits";
            if (!formData.location.pinCode.startsWith('6')) return "PIN code must start with 6";
            if (!formData.location.registeredAddress) return "Registered address is required";
        }
        if (step === 3) {
            if (!formData.member.fullName) return "Member full name is required";
            if (!/^[6-9]\d{9}$/.test(formData.member.mobile)) return "Enter a valid 10-digit mobile starting with 6-9";
            if (!formData.member.officeType) return "Office type is required";
            if (!formData.member.roleInAgency) return "Role is required";
            if (!formData.member.dateOfBirth) return "Date of birth is required";
        }
        if (step === 4) {
            if (!formData.documents.agencyAddressProof.url) return "Agency Address Proof is required";
            if (!formData.documents.shopPhoto.url) return "Shop Front Photo is required";
        }
        if (step === 5) {
            // New Step 5: Partners & Staff (Optional)
        }
        if (step === 6) {
            if (!formData.email) return "Account email is required";
            if (formData.password.length < 8) return "Password must be at least 8 characters";
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) return "Password must have Uppercase, Lowercase, and Number";
            if (formData.password !== formData.confirmPassword) return "Passwords do not match";
        }
        return null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData.documents) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 2 * 1024 * 1024) {
            setError(`${file.name} exceeds 2MB limit.`);
            return;
        }

        setUploading(field);
        setError(null);

        try {
            // Simulated Upload Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real app, you'd upload to S3/Cloudinary here
            // For now, we use a placeholder and store the name
            setFormData(prev => ({
                ...prev,
                documents: {
                    ...prev.documents,
                    [field]: {
                        url: `https://placeholder.com/uploaded/${file.name}`,
                        publicId: `inst_${Date.now()}`
                    }
                }
            }));
        } catch (err) {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    const removeFile = (field: keyof typeof formData.documents) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [field]: { url: '', publicId: '' }
            }
        }));
        // Reset the input value so the same file can be selected again
        if (fileRefs[field].current) fileRefs[field].current!.value = '';
    };

    const nextStep = () => {
        const err = validateStep(currentStep);
        if (err) {
            setError(err);
            return;
        }
        setError(null);
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateStep(6);
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError(null);

        // Prepare structured data according to backend schema
        const payload = {
            email: formData.email,
            password: formData.password,
            membershipType: formData.membershipType,
            establishment: {
                ...formData.establishment,
                yearOfEstablishment: parseInt(formData.establishment.yearOfEstablishment) || new Date().getFullYear(),
                gstRegistered: formData.establishment.gstRegistered
            },
            location: {
                ...formData.location,
                region: formData.location.region || formData.location.district,
                pinCode: formData.location.pinCode,
                communicationAddress: formData.location.isSameAddress ? formData.location.registeredAddress : formData.location.communicationAddress,
                isSameAddress: formData.location.isSameAddress
            },
            member: {
                ...formData.member,
                dateOfBirth: formData.member.dateOfBirth
            },
            partner: formData.partner,
            staff: formData.staff,
            documents: formData.documents,
            referredBy: formData.referralCode
        };

        const resultAction = await dispatch(registerMemberUser(payload));

        setLoading(false);

        if (registerMemberUser.fulfilled.match(resultAction)) {
            localStorage.removeItem("agencyRegistrationDraft"); // Clear draft on success
            navigate('/login', {
                state: { message: resultAction.payload.message || 'Registration successful!' }
            });
        } else {
            setError(resultAction.payload as string || 'Registration failed');
        }
    };

    const renderProgress = () => (
        <div className="flex items-center justify-between mb-8 px-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {step}
                    </div>
                    {step < 6 && (
                        <div className={`w-8 h-1 transition-colors ${currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                            }`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            {recovered && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
                        <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm font-bold text-emerald-700">Recovered your unfinished registration.</p>
                    <button type="button" onClick={() => setRecovered(false)} className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agency Registration</h1>
                <p className="text-sm text-slate-500 mt-1">Join our network of elite travel agency professionals.</p>
            </div>

            {renderProgress()}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                    <Shield size={16} />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* STEP 1: Establishment */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-600" />
                            Agency Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Agency Name</label>
                                <input name="establishment.name" value={formData.establishment.name} onChange={handleChange} placeholder="Elite Travels" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Trade Name</label>
                                <input name="establishment.tradeName" value={formData.establishment.tradeName} onChange={handleChange} placeholder="Elite Travel & Tours" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Official Email</label>
                                <input name="establishment.officialEmail" value={formData.establishment.officialEmail} onChange={handleChange} placeholder="info@elitetravels.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Classification</label>
                                <select name="establishment.officialClassification" value={formData.establishment.officialClassification} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option value="">Select Category</option>
                                    <option value="Proprietorship">Proprietorship</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Private Limited">Private Limited</option>
                                    <option value="LLP">LLP</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Business Type</label>
                                <select name="establishment.businessType" value={formData.establishment.businessType} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option value="">Select Business Type</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Service">Service</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Incorporation Year</label>
                                <input type="number" name="establishment.yearOfEstablishment" value={formData.establishment.yearOfEstablishment} onChange={handleChange} placeholder="2010" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Website</label>
                                <input name="establishment.website" value={formData.establishment.website} onChange={handleChange} placeholder="www.example.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="establishment.gstRegistered" checked={formData.establishment.gstRegistered} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Registered for GST</span>
                                </label>
                            </div>
                            {formData.establishment.gstRegistered && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">GST Number</label>
                                    <input name="establishment.gstNumber" value={formData.establishment.gstNumber} onChange={handleChange} placeholder="GSTXXXXXXXXXXXX" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: Location */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />
                            Location Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">District</label>
                                <input name="location.district" value={formData.location.district} onChange={handleChange} placeholder="Kozhikode" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">City</label>
                                <input name="location.city" value={formData.location.city} onChange={handleChange} placeholder="Kochi" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Pin Code</label>
                                <input name="location.pinCode" value={formData.location.pinCode} onChange={handleChange} placeholder="673001" maxLength={6} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Registered Address</label>
                                <textarea name="location.registeredAddress" value={formData.location.registeredAddress} onChange={handleChange} rows={3} placeholder="Full address..." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input type="checkbox" name="location.isSameAddress" checked={formData.location.isSameAddress} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Communication address is same as registered</span>
                                </label>
                            </div>
                            {!formData.location.isSameAddress && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Communication Address</label>
                                    <textarea name="location.communicationAddress" value={formData.location.communicationAddress} onChange={handleChange} rows={3} placeholder="Mailing address..." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: Member Info */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <UserIcon size={20} className="text-blue-600" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                                <input name="member.fullName" value={formData.member.fullName} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Mobile Number</label>
                                <input name="member.mobile" value={formData.member.mobile} onChange={handleChange} placeholder="9876543210" maxLength={10} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date of Birth</label>
                                <input type="date" name="member.dateOfBirth" value={formData.member.dateOfBirth} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Office Type</label>
                                <select name="member.officeType" value={formData.member.officeType} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option value="">Select Office</option>
                                    <option value="Head Office">Head Office</option>
                                    <option value="Branch Office">Branch Office</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Role in Agency</label>
                                <select name="member.roleInAgency" value={formData.member.roleInAgency} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option value="">Select Role</option>
                                    <option value="Owner">Owner</option>
                                    <option value="Partner">Partner</option>
                                    <option value="Director">Director</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Landline (Optional)</label>
                                <input name="member.landline" value={formData.member.landline} onChange={handleChange} placeholder="0484 1234567" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: Document Vault (NEW) */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ImageIcon size={20} className="text-blue-600" />
                            Document Repository
                        </h3>
                        <p className="text-xs text-slate-500 font-medium -mt-2">Upload mandatory documents for verification. Max 2MB per file.</p>

                        <div className="space-y-4">
                            {[
                                { id: 'agencyAddressProof', label: 'Agency Address Proof', icon: MapPin },
                                { id: 'shopPhoto', label: 'Shop Front Photo', icon: ImageIcon },
                            ].map((doc) => (
                                <div key={doc.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/30 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400">
                                            <doc.icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mandatory Verification</p>
                                        </div>
                                    </div>

                                    {formData.documents[doc.id as keyof typeof formData.documents].url ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                                                <CheckCircle2 size={14} />
                                                Uploaded
                                            </div>
                                            <button type="button" onClick={() => removeFile(doc.id as any)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                ref={fileRefs[doc.id as keyof typeof fileRefs]}
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleFileChange(e, doc.id as any)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileRefs[doc.id as keyof typeof fileRefs].current?.click()}
                                                disabled={uploading === doc.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-50"
                                            >
                                                {uploading === doc.id ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    <Upload size={14} />
                                                )}
                                                {uploading === doc.id ? 'Uploading...' : 'Select File'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 5: Partners & Staff */}
                {currentStep === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <UserIcon size={20} className="text-blue-600" />
                                Partner Details (Optional)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Partner Name</label>
                                    <input name="partner.name" value={formData.partner.name} onChange={handleChange} placeholder="Jane Doe" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Partner Mobile</label>
                                    <input name="partner.mobile" value={formData.partner.mobile} onChange={handleChange} placeholder="9876543211" maxLength={10} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-t border-slate-100 pt-6">
                                <UserIcon size={20} className="text-blue-600" />
                                Key Staff Details (Optional)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Staff Name</label>
                                    <input name="staff.name" value={formData.staff.name} onChange={handleChange} placeholder="Mark Smith" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Staff Mobile</label>
                                    <input name="staff.mobile" value={formData.staff.mobile} onChange={handleChange} placeholder="9876543212" maxLength={10} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-t border-slate-100 pt-6">
                                <Shield size={20} className="text-blue-600" />
                                Referral Program
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Referral Code (If any)</label>
                                <input name="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="REFXXXXXX" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6: Auth Account */}
                {currentStep === 6 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Lock size={20} className="text-blue-600" />
                            Account Credentials
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Login Email</label>
                                <input name="email" value={formData.email} onChange={handleChange} placeholder="member@example.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Confirm Password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    {currentStep > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 6 ? (
                        <button type="button" onClick={nextStep} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                            Continue
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-70">
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Complete Registration
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">
                    Already a member?{' '}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline ml-1">Sign In instead</Link>
                </p>
            </div>
        </div>
    );
}
