import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const MemberRegister = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    establishment: {
      name: '',
      tradeName: '',
      yearOfEstablishment: '',
      officialClassification: 'Proprietorship',
      businessType: 'Retail',
      officialEmail: '',
      gstRegistered: false,
      gstNumber: '',
    },
    location: {
      district: '',
      region: '',
      city: '',
      pinCode: '',
      registeredAddress: '',
      communicationAddress: '',
      isSameAddress: true,
    },
    member: {
      officeType: 'Head Office',
      roleInAgency: 'Owner',
      fullName: '',
      dateOfBirth: '',
      mobile: '',
      landline: '',
    },
    partner: { name: '', mobile: '' },
    staff: { name: '', mobile: '' },
  })

  const [files, setFiles] = useState({
    agencyAddressProof: null,
    shopPhoto: null,
    businessCard: null,
  })

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
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }))
    }
    if (error) setError(null)
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }))
    }
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.member.fullName || !formData.member.mobile) {
        setError('Please fill in all required fields')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        return false
      }
    }
    if (step === 2) {
      if (!formData.establishment.name || !formData.establishment.tradeName || !formData.establishment.officialEmail) {
        setError('Please fill in establishment details')
        return false
      }
    }
    setError(null)
    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep(prev => prev + 1)
  }
  const prevStep = () => setStep(prev => prev - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < 4) {
      nextStep()
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // Use FormData for multipart/form-data with nested fields (handled by parseNestedBody middleware)
      const data = new FormData()
      
      // Flatten data for dot-notation keys
      const flatten = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key]
          const fieldName = prefix ? `${prefix}.${key}` : key
          if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
            flatten(value, fieldName)
          } else {
             if (value !== undefined && value !== '') {
               data.append(fieldName, value)
             }
          }
        })
      }
      
      // Remove confirmPassword before sending
      const { confirmPassword, ...submitData } = formData
      flatten(submitData)

      // Append files
      if (files.agencyAddressProof) data.append('agencyAddressProof', files.agencyAddressProof)
      if (files.shopPhoto) data.append('shopPhoto', files.shopPhoto)
      if (files.businessCard) data.append('businessCard', files.businessCard)

      const response = await memberEndpoints.registration.register(data)
      
      if (response && response.success) {
        setSuccess(true)
        window.scrollTo(0, 0)
      } else {
        const errorMsg = response?.data?.errors?.join(', ') || response?.message || 'Registration failed'
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Registration error:', err)
      const errorData = err.response?.data
      const message = errorData?.errors?.join(', ') || errorData?.message || 'An error occurred during registration.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-[440px] w-full bg-slate-900/40 border border-green-500/20 rounded-[40px] p-10 backdrop-blur-2xl text-center animate-fadeUp">
          <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 text-green-500 shadow-lg shadow-green-500/20">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Application Submitted!</h2>
          <p className="text-slate-400 text-xs mb-8 leading-relaxed px-4">
            Thank you for registering. Our team is now verifying your documents. We'll notify you via email once approved.
          </p>
          <Link to="/member/login" className="inline-block w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 shadow-lg shadow-blue-600/20">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative p-4 py-20 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(rgba(37,99,235,0.12)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] -top-[100px] -right-[50px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse pointer-events-none" />
      <div className="fixed w-[500px] h-[500px] -bottom-[50px] -left-[100px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse pointer-events-none" />

      <div className="w-full max-w-[800px] animate-fadeUp z-10">
        <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          
          {/* Progress Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-10 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-base shadow-lg shadow-blue-600/20">🤝</div>
                <h1 className="text-xl font-bold text-white tracking-tight">Member Registration</h1>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest ml-1">Secure Enrollment Portal</p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 self-start sm:self-center">
              {[1, 2, 3, 4].map(num => (
                <div 
                  key={num}
                  className={`flex items-center justify-center w-7 h-7 rounded-xl text-[9px] font-black transition-all duration-500 ${step >= num ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-600'}`}
                >
                  {step > num ? '✓' : num}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center font-bold animate-shake uppercase tracking-wider">
              {error}
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="space-y-8"
            onKeyDown={(e) => { if (e.key === 'Enter' && step < 4) e.preventDefault() }}
          >
            {/* STEP 1: ACCOUNT & MEMBER */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Account Security</h3>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Email Address</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Password</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="8+ chars (A-z, 1-9)" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Confirm Password</label>
                    <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="Re-enter password" />
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Personal Details</h3>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Full Name</label>
                    <input name="member.fullName" type="text" value={formData.member.fullName} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="Arjun Raghavan" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Mobile Number</label>
                    <input name="member.mobile" type="tel" value={formData.member.mobile} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="9876543210" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Date of Birth</label>
                    <input name="member.dateOfBirth" type="date" value={formData.member.dateOfBirth} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 [color-scheme:dark] text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ESTABLISHMENT */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Business Identity</h3>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Establishment Name</label>
                    <input name="establishment.name" type="text" value={formData.establishment.name} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="Green Valley Holidays" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Trade Name</label>
                    <input name="establishment.tradeName" type="text" value={formData.establishment.tradeName} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500 focus:bg-white/[0.08]" placeholder="GVH Travels" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Year</label>
                      <input name="establishment.yearOfEstablishment" type="number" value={formData.establishment.yearOfEstablishment} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500" placeholder="2020" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Business Type</label>
                       <select name="establishment.businessType" value={formData.establishment.businessType} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:border-blue-500">
                        {['Retail', 'Wholesale', 'Service', 'Manufacturing', 'Trading', 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Official Contact</h3>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Official Email</label>
                    <input name="establishment.officialEmail" type="email" value={formData.establishment.officialEmail} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:border-blue-500" placeholder="official@company.com" />
                  </div>
                  <div className="space-y-4 pt-2">
                    <label className="flex items-center gap-3 group cursor-pointer">
                      <input name="establishment.gstRegistered" type="checkbox" checked={formData.establishment.gstRegistered} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10 checked:bg-blue-600 transition-all" />
                      <span className="text-slate-300 text-xs font-semibold">Registered for GST?</span>
                    </label>
                    {formData.establishment.gstRegistered && (
                      <div className="animate-scaleIn">
                        <input name="establishment.gstNumber" type="text" value={formData.establishment.gstNumber} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm uppercase" placeholder="GSTN1234567890" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">District</label>
                    <input name="location.district" type="text" value={formData.location.district} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm" placeholder="Ernakulam" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">City</label>
                    <input name="location.city" type="text" value={formData.location.city} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm" placeholder="Kochi City" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Region</label>
                    <input name="location.region" type="text" value={formData.location.region} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm" placeholder="Central" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">PIN Code</label>
                    <input name="location.pinCode" type="text" value={formData.location.pinCode} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm" placeholder="682001" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Registered Office Address</label>
                  <textarea name="location.registeredAddress" value={formData.location.registeredAddress} onChange={handleChange} required rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm" placeholder="Full address of registered office" />
                </div>

                <div className="flex items-center gap-3 px-1">
                  <input name="location.isSameAddress" type="checkbox" checked={formData.location.isSameAddress} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10" />
                  <span className="text-slate-300 text-xs font-semibold">Communication address is same as registered office</span>
                </div>

                {!formData.location.isSameAddress && (
                  <div className="space-y-1 animate-scaleIn">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Communication Address</label>
                    <textarea name="location.communicationAddress" value={formData.location.communicationAddress} onChange={handleChange} rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm" placeholder="Full address for communications" />
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: DOCUMENTS */}
            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                {Object.keys(files).map((key) => (
                  <div key={key} className="space-y-4">
                    <div className="bg-slate-800/10 border border-white/5 rounded-3xl p-6 transition-all hover:bg-slate-800/20 hover:border-blue-500/20 relative min-h-[140px] flex items-center justify-center">
                      <div className="text-center group-hover:scale-105 transition-transform duration-500">
                        <div className="text-xl mb-2">📄</div>
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 pointer-events-none">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p className="text-slate-500 text-[8px] uppercase tracking-tighter pointer-events-none">JPG, PNG or PDF • 5MB</p>
                      </div>
                      <input
                        type="file"
                        name={key}
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                      {files[key] && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-blue-400 text-[8px] font-bold uppercase bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 animate-scaleIn">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          File Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 min-h-[140px]">
                  <p className="text-slate-400 text-[9px] font-medium text-center leading-relaxed max-w-[180px]">
                    By continuing, you agree to our Terms and verify that the uploaded documents are authentic.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="w-full sm:w-auto text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors py-4">
                  ← Previous Step
                </button>
              ) : (
                <Link to="/member/login" className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-blue-400 transition-colors">
                  Already a member? Sign In
                </Link>
              )}

              <div className="flex items-center gap-4 w-full sm:w-auto">
                {step < 4 ? (
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl px-10 py-4 font-bold text-xs tracking-[0.1em] uppercase transition-all hover:bg-blue-500 hover:-translate-y-0.5 shadow-lg shadow-blue-600/20"
                  >
                    Continue →
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl px-12 py-4 font-bold text-xs tracking-[0.1em] uppercase shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <p className="text-center mt-10 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
          Secure Registration System • © 2025 Association
        </p>
      </div>
    </div>
  )
}

export default MemberRegister
