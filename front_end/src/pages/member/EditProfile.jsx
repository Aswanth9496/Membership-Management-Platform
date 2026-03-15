import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const Input = ({ label, name, type = "text", placeholder, value, onChange, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">{label}</label>
    <input 
      name={name} 
      type={type} 
      value={value} 
      onChange={onChange} 
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none placeholder:text-slate-300 shadow-sm" 
      placeholder={placeholder} 
    />
  </div>
)

const Select = ({ label, name, options, value, onChange, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">{label}</label>
    <select 
      name={name} 
      value={value} 
      onChange={onChange} 
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none shadow-sm appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
)

const TextArea = ({ label, name, value, onChange, placeholder, rows = 2, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest ml-1">{label}</label>
    <textarea 
      name={name}
      value={value}
      onChange={onChange}
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

  const [formData, setFormData] = useState({
    establishment: {
      name: '',
      tradeName: '',
      yearOfEstablishment: '',
      officialClassification: '',
      businessType: '',
      officialEmail: '',
      gstRegistered: false,
      gstNumber: '',
      website: '',
    },
    location: {
      district: '',
      region: '',
      city: '',
      pinCode: '',
      registeredAddress: '',
      communicationAddress: '',
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
              officialEmail: data.establishment?.officialEmail || '',
              gstRegistered: data.establishment?.gstRegistered || false,
              gstNumber: data.establishment?.gstNumber || '',
              website: data.establishment?.website || '',
            },
            location: {
              district: data.location?.district || '',
              region: data.location?.region || '',
              city: data.location?.city || '',
              pinCode: data.location?.pinCode || '',
              registeredAddress: data.location?.registeredAddress || '',
              communicationAddress: data.location?.communicationAddress || '',
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.includes('.')) {
      const [section, field] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        requestedChanges: formData
      }

      const response = await memberEndpoints.profileUpdates.requestUpdate(payload)
      
      if (response && response.success) {
        navigate('/member/profile', { state: { message: response.message || 'Update request submitted successfully' } })
      } else {
        const errorMsg = response?.data?.errors?.join(', ') || response?.message || 'Failed to submit update request'
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
              <Input label="Establishment Name" name="establishment.name" value={formData.establishment.name} onChange={handleChange} />
              <Input label="Trade Name" name="establishment.tradeName" value={formData.establishment.tradeName} onChange={handleChange} />
              <Input label="Year" name="establishment.yearOfEstablishment" type="number" value={formData.establishment.yearOfEstablishment} onChange={handleChange} />
              <Select 
                label="Classification" 
                name="establishment.officialClassification" 
                value={formData.establishment.officialClassification} 
                onChange={handleChange}
                options={['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'Trust', 'Other']} 
              />
              <Select 
                label="Business Type" 
                name="establishment.businessType" 
                value={formData.establishment.businessType} 
                onChange={handleChange}
                options={['Retail', 'Wholesale', 'Service', 'Manufacturing', 'Trading', 'Other']} 
              />
              <Input label="Official Email" name="establishment.officialEmail" type="email" value={formData.establishment.officialEmail} onChange={handleChange} />
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
              <Input label="District" name="location.district" value={formData.location.district} onChange={handleChange} />
              <Input label="City" name="location.city" value={formData.location.city} onChange={handleChange} />
              <Input label="Region" name="location.region" value={formData.location.region} onChange={handleChange} />
              <Input label="PIN Code" name="location.pinCode" value={formData.location.pinCode} onChange={handleChange} />
              <TextArea label="Registered Address" name="location.registeredAddress" value={formData.location.registeredAddress} onChange={handleChange} className="md:col-span-2 lg:col-span-2" />
              <TextArea label="Communication Address" name="location.communicationAddress" value={formData.location.communicationAddress} onChange={handleChange} className="md:col-span-2 lg:col-span-2" />
            </div>
          </div>

          {/* Section 3: Personal */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👤</span>
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.2em]">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <Input label="Full Name" name="member.fullName" value={formData.member.fullName} onChange={handleChange} />
              <Input label="Mobile" name="member.mobile" value={formData.member.mobile} onChange={handleChange} />
              <Input label="Landline" name="member.landline" value={formData.member.landline} onChange={handleChange} />
              <Input label="Date of Birth" name="member.dateOfBirth" type="date" value={formData.member.dateOfBirth} onChange={handleChange} />
              <Input label="Role" name="member.roleInAgency" value={formData.member.roleInAgency} onChange={handleChange} />
              <Select 
                label="Office Type" 
                name="member.officeType" 
                value={formData.member.officeType} 
                onChange={handleChange}
                options={['Head Office', 'Branch Office', 'Corporate Office', 'Other']} 
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
                 <Input label="Name" name="partner.name" value={formData.partner.name} onChange={handleChange} />
                 <Input label="Mobile" name="partner.mobile" value={formData.partner.mobile} onChange={handleChange} />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 text-[8px] font-bold text-slate-400 uppercase opacity-60">Staff Contact</div>
                 <Input label="Name" name="staff.name" value={formData.staff.name} onChange={handleChange} />
                 <Input label="Mobile" name="staff.mobile" value={formData.staff.mobile} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 5: Remarks */}
          <div className="p-6 space-y-4">
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
                 disabled={loading}
                 className="flex-1 sm:flex-initial bg-blue-600 text-white rounded-xl px-12 py-3 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
               >
                 {loading ? (
                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <>Submit All Changes ✓</>
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
