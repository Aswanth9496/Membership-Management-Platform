import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'
import { BUSINESS_TYPES, OFFICE_TYPES, ROLES_IN_AGENCY, OFFICIAL_CLASSIFICATIONS } from '../../components/member/register/registrationConstants'

const Input = ({ label, name, type = "text", placeholder, value, onChange, className = "", required = false }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none placeholder:text-slate-300 shadow-sm"
      placeholder={placeholder}
    />
  </div>
)

const Select = ({ label, name, options, value, onChange, className = "", required = false }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none shadow-sm appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
)

const TextArea = ({ label, name, value, onChange, placeholder, rows = 2, className = "", required = false }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none placeholder:text-slate-300 shadow-sm resize-none"
      placeholder={placeholder}
    />
  </div>
)

const EditProfile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [fileErrors, setFileErrors] = useState({})
  // Snapshot of the form values as loaded from the server
  const initialFormData = useRef(null)

  const [formData, setFormData] = useState({
    establishment: {
      name: '',
      tradeName: '',
      yearOfEstablishment: '',
      officialClassification: '',
      businessType: '',
      businessTypeDescription: '',
      officialEmail: '',
      gstRegistered: false,
      gstNumber: '',
      website: '',
    },
    location: {
      state: '',
      district: '',
      region: '',
      city: '',
      pinCode: '',
      registeredAddress: '',
      communicationAddress: '',
      isSameAddress: true,
    },
    documents: {
      agencyAddressProof: null,
      activityLicense: null,
      shopPhoto: null,
      businessCard: null,
      agencyLogo: null,
      memberPhoto: null,
      additionalDoc: null,
    },
    member: {
      fullName: '',
      mobile: '',
      landline: '',
      dateOfBirth: '',
      roleInAgency: '',
      officeType: '',
    },
    partner: {
      name: '',
      mobile: '',
    },
    staff: {
      name: '',
      mobile: '',
    },
    remarks: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true)
        const response = await memberEndpoints.profile.getProfile()
        if (response && response.success) {
          const data = response.data?.member || {}
          setProfile(data)
          setFormData({
            establishment: {
              name: data.establishment?.name || '',
              tradeName: data.establishment?.tradeName || '',
              yearOfEstablishment: data.establishment?.yearOfEstablishment || '',
              officialClassification: data.establishment?.officialClassification || '',
              businessType: data.establishment?.businessType || '',
              businessTypeDescription: data.establishment?.businessTypeDescription || '',
              officialEmail: data.establishment?.officialEmail || '',
              gstRegistered: data.establishment?.gstRegistered || false,
              gstNumber: data.establishment?.gstNumber || '',
              website: data.establishment?.website || '',
            },
            location: {
              state: data.location?.state || '',
              district: data.location?.district || '',
              region: data.location?.region || '',
              city: data.location?.city || '',
              pinCode: data.location?.pinCode || '',
              registeredAddress: data.location?.registeredAddress || '',
              communicationAddress: data.location?.communicationAddress || '',
              isSameAddress: data.location?.isSameAddress !== false,
            },
            documents: {
              agencyAddressProof: null,
              activityLicense: null,
              shopPhoto: null,
              businessCard: null,
              agencyLogo: null,
              memberPhoto: null,
              additionalDoc: null,
            },
            member: {
              fullName: data.member?.fullName || '',
              mobile: data.member?.mobile || '',
              landline: data.member?.landline || '',
              dateOfBirth: data.member?.dateOfBirth && !isNaN(new Date(data.member.dateOfBirth).getTime())
                ? new Date(data.member.dateOfBirth).toISOString().split('T')[0]
                : '',
              roleInAgency: data.member?.roleInAgency || '',
              officeType: data.member?.officeType || '',
            },
            partner: {
              name: data.partner?.name || '',
              mobile: data.partner?.mobile || '',
            },
            staff: {
              name: data.staff?.name || '',
              mobile: data.staff?.mobile || '',
            },
            remarks: ''
          })
          // Capture initial snapshot for change detection
          initialFormData.current = {
            establishment: {
              name: data.establishment?.name || '',
              tradeName: data.establishment?.tradeName || '',
              yearOfEstablishment: data.establishment?.yearOfEstablishment || '',
              officialClassification: data.establishment?.officialClassification || '',
              businessType: data.establishment?.businessType || '',
              businessTypeDescription: data.establishment?.businessTypeDescription || '',
              officialEmail: data.establishment?.officialEmail || '',
              gstRegistered: data.establishment?.gstRegistered || false,
              gstNumber: data.establishment?.gstNumber || '',
              website: data.establishment?.website || '',
            },
            location: {
              state: data.location?.state || '',
              district: data.location?.district || '',
              region: data.location?.region || '',
              city: data.location?.city || '',
              pinCode: data.location?.pinCode || '',
              registeredAddress: data.location?.registeredAddress || '',
              communicationAddress: data.location?.communicationAddress || '',
              isSameAddress: data.location?.isSameAddress !== false,
            },
            member: {
              fullName: data.member?.fullName || '',
              mobile: data.member?.mobile || '',
              landline: data.member?.landline || '',
              dateOfBirth: data.member?.dateOfBirth && !isNaN(new Date(data.member.dateOfBirth).getTime())
                ? new Date(data.member.dateOfBirth).toISOString().split('T')[0]
                : '',
              roleInAgency: data.member?.roleInAgency || '',
              officeType: data.member?.officeType || '',
            },
            partner: {
              name: data.partner?.name || '',
              mobile: data.partner?.mobile || '',
            },
            staff: {
              name: data.staff?.name || '',
              mobile: data.staff?.mobile || '',
            },
          }
        } else {
          setError('Failed to load profile details')
        }
      } catch (err) {
        console.error('Error fetching member profile:', err)
        const errorMsg = err.message || err.data?.message || err.response?.data?.message || 'Error connecting to server'
        setError(errorMsg)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Detect if the user has changed anything vs. the loaded snapshot
  const hasChanges = useMemo(() => {
    if (!initialFormData.current) return false
    const init = initialFormData.current
    const sections = ['establishment', 'location', 'member', 'partner', 'staff']
    for (const section of sections) {
      const cur = formData[section]
      const orig = init[section]
      for (const key of Object.keys(orig)) {
        if (String(cur[key] ?? '') !== String(orig[key] ?? '')) return true
      }
    }
    // Also flag as changed if any file has been selected
    const docs = formData.documents
    if (docs && Object.values(docs).some(v => v !== null)) return true
    return false
  }, [formData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value

    // Input masking to match registration behavior
    if (name === 'location.pinCode') finalValue = value.replace(/\D/g, '').slice(0, 6)
    if (name === 'member.mobile') finalValue = value.replace(/\D/g, '').slice(0, 10)

    if (name.includes('.')) {
      const [section, field] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: finalValue
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }))
    }
    if (error) setError(null)
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    if (files && files.length > 0) {
      if (name === 'shopPhoto') {
        const selected = Array.from(files)
        let localError = ''
        selected.forEach(file => {
          if (!ALLOWED_MIME.includes(file.type)) localError = 'Unsupported type. Use JPG, PNG or PDF.'
          if (file.size > MAX_FILE_SIZE) localError = 'File too large (max 5MB).'
        })

        if (localError) {
          setFileErrors(prev => ({ ...prev, [name]: localError }))
          return
        }

        setFileErrors(prev => ({ ...prev, [name]: '' }))
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [name]: selected // Store as array
          }
        }))
      } else {
        const file = files[0]
        let localError = ''
        if (!ALLOWED_MIME.includes(file.type)) localError = 'Unsupported type. Use JPG, PNG or PDF.'
        if (file.size > MAX_FILE_SIZE) localError = 'File too large (max 5MB).'

        if (localError) {
          setFileErrors(prev => ({ ...prev, [name]: localError }))
          return
        }

        setFileErrors(prev => ({ ...prev, [name]: '' }))
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [name]: file
          }
        }))
      }
    }
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check for existing file errors
    const hasFileErrors = Object.values(fileErrors).some(err => err);
    if (hasFileErrors) {
      setError('Please fix file upload errors before submitting');
      setLoading(false);
      return;
    }

    // Basic client-side required field check
    const requiredFields = [
      { key: 'establishment.name', label: 'Establishment Name' },
      { key: 'establishment.tradeName', label: 'Trade Name' },
      { key: 'establishment.yearOfEstablishment', label: 'Year of Establishment' },
      { key: 'establishment.officialEmail', label: 'Official Email' },
      { key: 'location.state', label: 'State' },
      { key: 'location.district', label: 'District' },
      { key: 'location.city', label: 'City' },
      { key: 'location.region', label: 'Region' },
      { key: 'location.pinCode', label: 'Pin Code' },
      { key: 'location.registeredAddress', label: 'Registered Address' },
      { key: 'member.fullName', label: 'Full Name' },
      { key: 'member.mobile', label: 'Mobile Number' },
      { key: 'member.dateOfBirth', label: 'Date of Birth' }
    ];

    for (const field of requiredFields) {
      const parts = field.key.split('.');
      const value = parts.reduce((obj, key) => obj?.[key], formData);
      if (!value || String(value).trim() === '') {
        setError(`${field.label} is required`);
        setLoading(false);
        return;
      }
    }

    // Conditional Partner required if Partnership
    if (formData.establishment.officialClassification === 'Partnership') {
      if (!formData.partner.name || !formData.partner.mobile) {
        setError('Partner Name and Mobile are required for Partnerships');
        setLoading(false);
        return;
      }
    }

    try {
      const submissionData = new FormData();
      const requestedChanges = { ...formData };
      delete requestedChanges.documents;

      // Ensure address consistency if "Same Address" is checked
      if (requestedChanges.location?.isSameAddress) {
        requestedChanges.location.communicationAddress = requestedChanges.location.registeredAddress;
      }

      submissionData.append('requestedChanges', JSON.stringify(requestedChanges));

      if (formData.documents) {
        Object.keys(formData.documents).forEach(key => {
          const doc = formData.documents[key];
          if (doc) {
            if (key === 'shopPhoto' && Array.isArray(doc)) {
              doc.forEach(file => submissionData.append(key, file));
            } else {
              submissionData.append(key, doc);
            }
          }
        });
      }

      let response;
      if (['submitted', 'rejected'].includes(profile?.status)) {
        response = await memberEndpoints.profileUpdates.directUpdate(submissionData)
      } else {
        response = await memberEndpoints.profileUpdates.requestUpdate(submissionData)
      }
      
      if (response && response.success) {
        navigate('/member/profile', { state: { message: response.message || 'Update successful' } })
      } else {
        const errorMsg = response?.data?.errors?.join(', ') || response?.message || 'Failed to submit update'
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Update request error:', err)
      const errorMsg = err.message || err.data?.message || err.response?.data?.message || 'Error connecting to server'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp p-2 md:p-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/member/profile')}
            className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm group font-bold"
          >
            ←
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none mb-1">Update Profile</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Unified Modification Request</p>
          </div>
        </div>

        {profile?.profileChangeRequest?.pending && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl animate-pulse">
            <span className="text-xs">⚠️</span>
            <p className="text-[9px] text-amber-700 font-bold uppercase tracking-widest">A change request is already pending approval</p>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-lg">
          <span className="text-xs">🛡️</span>
          <p className="text-[8px] text-blue-700 font-bold uppercase tracking-widest">Global Update Mode</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-50">
          {/* Section 1: Establishment */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🏢</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Establishment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <Input label="Establishment Name" name="establishment.name" value={formData.establishment.name} onChange={handleChange} required />
              <Input label="Trade Name" name="establishment.tradeName" value={formData.establishment.tradeName} onChange={handleChange} required />
              <Input label="Year" name="establishment.yearOfEstablishment" type="number" value={formData.establishment.yearOfEstablishment} onChange={handleChange} required />
              <Select
                label="Classification"
                name="establishment.officialClassification"
                value={formData.establishment.officialClassification}
                onChange={handleChange}
                options={OFFICIAL_CLASSIFICATIONS}
                required
              />
              <Select
                label="Business Type"
                name="establishment.businessType"
                value={formData.establishment.businessType}
                onChange={handleChange}
                options={BUSINESS_TYPES}
                required
              />
              {formData.establishment.businessType === 'Other' && (
                <div className="animate-scaleIn md:col-span-2">
                  <Input
                    label="Please describe your business type"
                    name="establishment.businessTypeDescription"
                    value={formData.establishment.businessTypeDescription}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <Input label="Official Email" name="establishment.officialEmail" type="email" value={formData.establishment.officialEmail} onChange={handleChange} required />
              <Input label="Website" name="establishment.website" value={formData.establishment.website} onChange={handleChange} placeholder="www.example.com" className="lg:col-span-2" />
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50/50 rounded-lg border border-slate-100 mt-auto h-[34px]">
                <input
                  name="establishment.gstRegistered"
                  type="checkbox"
                  checked={formData.establishment.gstRegistered}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 rounded border-slate-200 text-blue-600"
                />
                <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">GST Registered</span>
              </div>
              {formData.establishment.gstRegistered && (
                <div className="animate-scaleIn lg:col-span-1">
                  <Input label="GST Number" name="establishment.gstNumber" value={formData.establishment.gstNumber} onChange={handleChange} />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="p-6 space-y-4 bg-slate-50/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📍</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Location Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
              <Input label="State" name="location.state" value={formData.location.state} onChange={handleChange} required />
              <Input label="Region" name="location.region" value={formData.location.region} onChange={handleChange} required />
              <Input label="District" name="location.district" value={formData.location.district} onChange={handleChange} required />
              <Input label="City" name="location.city" value={formData.location.city} onChange={handleChange} required />
              <Input label="PIN Code" name="location.pinCode" value={formData.location.pinCode} onChange={handleChange} required />

              <div className="md:col-span-2 lg:col-span-4 flex items-center gap-2 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-100 mt-2">
                <input
                  name="location.isSameAddress"
                  type="checkbox"
                  checked={formData.location.isSameAddress}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 rounded border-slate-200 text-blue-600 cursor-pointer shadow-sm"
                />
                <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest cursor-pointer">Same Address for Registration and Communication</span>
              </div>

              <TextArea label="Registered Address" name="location.registeredAddress" value={formData.location.registeredAddress} onChange={handleChange} className={formData.location.isSameAddress ? "md:col-span-2 lg:col-span-4" : "md:col-span-2"} required />
              {!formData.location.isSameAddress && (
                <TextArea label="Communication Address" name="location.communicationAddress" value={formData.location.communicationAddress} onChange={handleChange} className="md:col-span-2" required />
              )}
            </div>
          </div>

          {/* Section 3: Personal */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👤</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <Input label="Full Name" name="member.fullName" value={formData.member.fullName} onChange={handleChange} required />
              <Input label="Mobile" name="member.mobile" value={formData.member.mobile} onChange={handleChange} required />
              <Input label="Landline" name="member.landline" value={formData.member.landline} onChange={handleChange} />
              <Input label="Date of Birth" name="member.dateOfBirth" type="date" value={formData.member.dateOfBirth} onChange={handleChange} required />
              <Select
                label="Role"
                name="member.roleInAgency"
                value={formData.member.roleInAgency}
                onChange={handleChange}
                options={ROLES_IN_AGENCY}
                required
              />
              <Select
                label="Office Type"
                name="member.officeType"
                value={formData.member.officeType}
                onChange={handleChange}
                options={OFFICE_TYPES}
                required
              />
            </div>
          </div>

          {/* Section 4: Secondary Contacts */}
          <div className="p-6 space-y-4 bg-slate-50/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👥</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Secondary Contacts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-r border-slate-100 pr-4">
                <div className="md:col-span-2 text-[8px] font-bold text-slate-400 uppercase opacity-60">Partner / Associate</div>
                <Input
                  label="Name"
                  name="partner.name"
                  value={formData.partner.name}
                  onChange={handleChange}
                  required={formData.establishment.officialClassification === 'Partnership'}
                />
                <Input
                  label="Mobile"
                  name="partner.mobile"
                  value={formData.partner.mobile}
                  onChange={handleChange}
                  required={formData.establishment.officialClassification === 'Partnership'}
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-[8px] font-bold text-slate-400 uppercase opacity-60">Staff Contact</div>
                <Input label="Name" name="staff.name" value={formData.staff.name} onChange={handleChange} />
                <Input label="Mobile" name="staff.mobile" value={formData.staff.mobile} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 5: Documents */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📁</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Verification Documents</h3>
            </div>
            <p className="text-[10px] text-slate-500 italic mb-2 leading-tight">Upload a new document if you want to replace the current one. Leave empty to keep your existing documents intact.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
              {[
                { key: 'agencyAddressProof', label: 'Agency Address Proof' },
                { key: 'activityLicense', label: 'Activity License' },
                { key: 'shopPhoto', label: 'Shop Photo' },
                { key: 'businessCard', label: 'Business Card' },
                { key: 'agencyLogo', label: 'Agency Logo' },
                { key: 'memberPhoto', label: 'Member Photo' },
                { key: 'additionalDoc', label: 'Additional Document' },
              ].map(doc => {
                const existingFile = profile?.documents?.[doc.key];
                const hasExisting = doc.key === 'shopPhoto'
                  ? (Array.isArray(existingFile) && existingFile.length > 0)
                  : (existingFile && existingFile.url);

                return (
                  <div key={doc.key} className="space-y-1">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{doc.label}</label>
                      {hasExisting && !formData.documents?.[doc.key] && (
                        <a
                          href={doc.key === 'shopPhoto' ? existingFile[0].url : existingFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-[8px] font-bold uppercase tracking-widest hover:underline"
                        >
                          View Current {doc.key === 'shopPhoto' && `(${existingFile.length})`}
                        </a>
                      )}
                    </div>
                    <label className={`flex items-center justify-center w-full ${fileErrors[doc.key] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-300'} border border-dashed rounded-xl px-4 py-3 text-slate-500 text-xs transition-all hover:bg-slate-100 hover:border-blue-400 cursor-pointer shadow-sm overflow-hidden`}>
                      <span className="truncate text-[10px]">
                        {doc.key === 'shopPhoto' && Array.isArray(formData.documents?.[doc.key])
                          ? `${formData.documents[doc.key].length} files selected`
                          : (formData.documents?.[doc.key]?.name || 'Click to select file')}
                      </span>
                      <input
                        type="file"
                        name={doc.key}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple={doc.key === 'shopPhoto'}
                      />
                    </label>
                    {fileErrors[doc.key] && (
                      <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest ml-1 mt-1">{fileErrors[doc.key]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Remarks */}
          <div className="p-6 space-y-4 bg-slate-50/20 shadow-inner rounded-b-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">💬</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Submission Justification</h3>
            </div>
            <TextArea label="Reason for Updates" name="remarks" value={formData.remarks} onChange={handleChange} rows={3} placeholder="Please explain why you are requesting these changes..." />
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <span className="text-xs">🕒</span>
              <p className="text-[8px] font-bold uppercase tracking-widest leading-none">Admin review required (24-48h)</p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/member/profile')}
                className="text-slate-400 text-[9px] font-bold uppercase tracking-widest hover:text-slate-600 py-2"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={loading || !hasChanges}
                title={!hasChanges ? 'Make a change first' : ''}
                className="flex-1 sm:flex-initial bg-blue-600 text-white rounded-xl px-12 py-3 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{['submitted', 'rejected'].includes(profile?.status) ? 'Update Profile' : 'Submit All Changes ✓'}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold text-center uppercase tracking-wider animate-shake">
          {error}
        </div>
      )}
    </div>
  )
}

export default EditProfile
