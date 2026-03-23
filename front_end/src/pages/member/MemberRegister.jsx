import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'
import InputField from '../../components/member/register/InputField'
import DocumentsUpload from '../../components/member/register/DocumentsUpload'
import ReferencesSearch from '../../components/member/register/ReferencesSearch'
import { BUSINESS_TYPES, OFFICE_TYPES, ROLES_IN_AGENCY, OFFICIAL_CLASSIFICATIONS, STEP_FIELDS } from '../../components/member/register/registrationConstants'
import { validateField as validateFieldFn, validateStep as validateStepFn } from '../../components/member/register/validation'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

const sanitizeId = (name) => name.replace(/\./g, '_')

const MemberRegister = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [success, setSuccess] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [showOtpField, setShowOtpField] = useState(false)
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    establishment: {
      name: '',
      tradeName: '',
      yearOfEstablishment: '',
      officialClassification: 'Private Limited',
      businessType: 'Travel Agent',
      businessTypeDescription: '',
      officialEmail: '',
      gstRegistered: false,
      gstNumber: '',
    },
    location: {
      state: '',
      district: '',
      city: '',
      region: '',
      pinCode: '',
      registeredAddress: '',
      communicationAddress: '',
      isSameAddress: true,
    },
    member: {
      officeType: 'Head Office',
      roleInAgency: 'Director',
      fullName: '',
      dateOfBirth: '',
      mobile: '',
      landline: '',
    },
    partner: { name: '', mobile: '' },
    staff: { name: '', mobile: '' },
    references: [],
  })

  const [files, setFiles] = useState({
    agencyAddressProof: null,
    activityLicense: null,
    shopPhoto: [], // support multiple
    businessCard: null,
    agencyLogo: null,
    memberPhoto: null,
    additionalDoc: null,
  })

  const [fileErrors, setFileErrors] = useState({})

  const [refSearch, setRefSearch] = useState('')
  const [refResults, setRefResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showRefDropdown, setShowRefDropdown] = useState(false)
  const searchContainerRef = useRef(null)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('registration_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const parsedData = parsed.formData || parsed;
        const merge = (target, source) => {
          if (!source) return target;
          const result = { ...target };
          Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              result[key] = merge(target[key] || {}, source[key]);
            } else {
              result[key] = source[key];
            }
          });
          return result;
        };
        setFormData(prev => ({ ...merge(prev, parsedData) }))
        if (parsed.step) setStep(parsed.step)
      } catch (e) {
        console.error('Failed to load saved registration data', e)
      }
    }
  }, [])

  useEffect(() => {
    const { password, confirmPassword, ...dataToSave } = formData;
    localStorage.setItem('registration_form', JSON.stringify({ formData: dataToSave, step }));
  }, [formData, step])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowRefDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setError(null)
    const fieldsForStep = STEP_FIELDS[step] || []
    if (fieldsForStep.length > 0) {
      setTouched(prev => {
        const next = { ...prev }
        fieldsForStep.forEach(k => delete next[k])
        return next
      })
    }
  }, [step])

  useEffect(() => {
    const searchMembers = async () => {
      if (refSearch.length < 2) {
        setRefResults([])
        return
      }
      setIsSearching(true)
      try {
        const response = await memberEndpoints.registration.getApprovedMembers(refSearch)
        if (response.success) {
          setRefResults(response.data.members.filter(m => !formData.references.some(r => r._id === m._id)))
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }
    const timer = setTimeout(searchMembers, 300)
    return () => clearTimeout(timer)
  }, [refSearch, formData.references])

  const addReference = (member) => {
    if (formData.references.length >= 2) return
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { _id: member._id, name: member.member?.fullName || member.name, company: member.establishment?.name || member.company }]
    }))
    setErrors(prev => ({ ...prev, references: '' }))
    setTouched(prev => ({ ...prev, references: true }))
    setRefSearch('')
    setRefResults([])
    setShowRefDropdown(false)
  }

  const removeReference = (id) => {
    setFormData(prev => {
      const newRefs = prev.references.filter(r => r._id !== id)
      if (newRefs.length === 0) setErrors(errs => ({ ...errs, references: 'At least one reference is mandatory' }))
      return { ...prev, references: newRefs }
    })
    setTouched(prev => ({ ...prev, references: true }))
  }

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    if (!formData.email) { setError('Please provide an email address first'); setStep(1); return }
    setLoading(true); setError(null)
    try {
      const res = await memberEndpoints.registration.sendOTP(formData.email)
      if (res.success) { setShowOtpField(true); setResendTimer(60); setError(null) } else { setError(res.message || 'Failed to send verification code') }
    } catch (err) { setError(err.message || 'Failed to send OTP') } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit code'); return }
    setLoading(true); setError(null)
    try {
      const res = await memberEndpoints.registration.verifyOTP(formData.email, otp)
      if (res.success) { setIsEmailVerified(true); setShowOtpField(false); setError(null) } else { setError(res.message || 'Invalid verification code') }
    } catch (err) { setError(err.message || 'Verification failed') } finally { setLoading(false) }
  }

  const validateField = (name, value) => {
    const errorMsg = validateFieldFn(formData, name, value)
    setErrors(prev => ({ ...prev, [name]: errorMsg }))
    return errorMsg === ''
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    if (selectedFiles && selectedFiles.length > 0) {
      if (name === 'shopPhoto') {
        const selected = Array.from(selectedFiles)
        const validFiles = []
        let localErrors = ''
        selected.forEach(file => {
          if (!ALLOWED_MIME.includes(file.type)) { localErrors = 'One or more files are unsupported. Only JPG, PNG and PDF allowed.'; return }
          if (file.size > MAX_FILE_SIZE) { localErrors = 'One or more files exceed 5MB size limit.'; return }
          validFiles.push(file)
        })
        setFileErrors(prev => ({ ...prev, [name]: localErrors }))
        if (localErrors) return
        setFiles(prev => {
          const existing = Array.isArray(prev.shopPhoto) ? prev.shopPhoto : []
          const combined = existing.concat(validFiles).slice(0, 4)
          return { ...prev, shopPhoto: combined }
        })
        setTouched(prev => ({ ...prev, [name]: true }))
        setErrors(prev => ({ ...prev, [name]: '' }))
      } else {
        const file = selectedFiles[0]
        let fileError = ''
        if (!ALLOWED_MIME.includes(file.type)) fileError = 'Unsupported file type. Only JPG, PNG and PDF allowed.'
        else if (file.size > MAX_FILE_SIZE) fileError = 'File too large. Maximum allowed size is 5MB.'
        setFileErrors(prev => ({ ...prev, [name]: fileError }))
        if (!fileError) { setFiles(prev => ({ ...prev, [name]: file })); setTouched(prev => ({ ...prev, [name]: true })); setErrors(prev => ({ ...prev, [name]: '' })) } else { setFiles(prev => ({ ...prev, [name]: null })); setTouched(prev => ({ ...prev, [name]: true })) }
      }
    }
  }

  const removeShopPhoto = (index) => {
    setFiles(prev => {
      const arr = Array.isArray(prev.shopPhoto) ? [...prev.shopPhoto] : []
      arr.splice(index, 1)
      return { ...prev, shopPhoto: arr }
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value
    if (name === 'location.pinCode') finalValue = value.replace(/\D/g, '').slice(0, 6)
    if (name.includes('.')) {
      const [section, field] = name.split('.')
      setFormData(prev => {
        const newState = { ...prev, [section]: { ...prev[section], [field]: finalValue } }
        if (field === 'businessType' && value !== 'Other') newState[section].businessTypeDescription = ''
        return newState
      })
    } else setFormData(prev => ({ ...prev, [name]: finalValue }))
    if (touched[name]) validateField(name, finalValue)
    if (error) setError(null)
  }

  const focusFirstError = (errs) => {
    const keys = Object.keys(errs)
    if (keys.length === 0) return
    const first = keys[0]
    const el = document.getElementById(sanitizeId(first))
    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } else { window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const validateStep = () => {
    const { isValid, stepErrors } = validateStepFn(step, formData, files)
    if (!isValid) {
      setError('Please correct the errors before proceeding')
      setErrors(prev => ({ ...prev, ...stepErrors }))
      const allTouched = {}
      Object.keys(stepErrors).forEach(key => allTouched[key] = true)
      setTouched(prev => ({ ...prev, ...allTouched }))
      focusFirstError(stepErrors)
    } else setError(null)
    return isValid
  }

  const nextStep = () => { if (validateStep()) setStep(prev => prev + 1) }
  const prevStep = () => setStep(prev => prev - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < 4) { nextStep(); return }
    const anyFileError = Object.values(fileErrors).some(v => v && v.length > 0)
    if (anyFileError) { setError('Please fix file upload errors before submitting'); focusFirstError(fileErrors); return }
    if (!validateStep()) return
    setLoading(true); setError(null)
    try {
      const data = new FormData()
      const flatten = (obj, prefix = '') => { Object.keys(obj).forEach(key => { const value = obj[key]; const fieldName = prefix ? `${prefix}.${key}` : key; if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) { flatten(value, fieldName) } else { if (value !== undefined && value !== '') data.append(fieldName, value) } }) }
      const { confirmPassword, references, ...submitData } = formData
      if (submitData.location.isSameAddress) submitData.location.communicationAddress = submitData.location.registeredAddress
      flatten(submitData)
      Object.keys(files).forEach(key => {
        if (key === 'shopPhoto' && Array.isArray(files.shopPhoto)) files.shopPhoto.forEach(f => data.append('shopPhoto', f))
        else if (files[key]) data.append(key, files[key])
      })
      if (formData.references && formData.references.length > 0) data.append('references', formData.references.map(r => r._id).join(','))
      const response = await memberEndpoints.registration.register(data)
      if (response && response.success) { setSuccess(true); localStorage.removeItem('registration_form'); window.scrollTo(0, 0) } else { const errorMsg = response?.data?.errors?.join(', ') || response?.message || 'Registration failed'; setError(errorMsg) }
    } catch (err) {
      console.error('Registration error:', err)
      const serverMessage = err.message || 'An error occurred during registration.'
      const serverData = err.data;
      const serverErrors = serverData?.errors;
      let topError = serverMessage;
      const newErrors = { ...errors };
      const newTouched = { ...touched };
      if (serverMessage.toLowerCase().includes('mobile number')) { newErrors['member.mobile'] = serverMessage; newTouched['member.mobile'] = true; setStep(1); }
      else if (serverMessage.toLowerCase().includes('email already registered')) { newErrors['email'] = serverMessage; newTouched['email'] = true; setStep(1); }
      if (serverErrors && Array.isArray(serverErrors)) {
        serverErrors.forEach(msg => {
          if (msg.includes('Pin code')) { newErrors['location.pinCode'] = msg; newTouched['location.pinCode'] = true; if (step > 3) setStep(3); }
          else if (msg.includes('GST number')) { newErrors['establishment.gstNumber'] = msg; newTouched['establishment.gstNumber'] = true; if (step > 2) setStep(2); }
        });
        topError = serverErrors.join(' • ');
      }
      setErrors(newErrors); setTouched(newTouched); setError(topError)
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-[440px] w-full bg-white border border-green-500/20 rounded-[40px] p-10 backdrop-blur-2xl text-center animate-fadeUp">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 text-green-600 shadow-lg shadow-green-500/20">✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
        <p className="text-gray-600 text-xs mb-8 leading-relaxed px-4">Thank you for registering. Our team is now verifying your documents. We'll notify you via email once approved.</p>
        <Link to="/member/login" className="inline-block w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 shadow-lg shadow-blue-600/20">Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center relative p-4 py-20 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(rgba(240,241,242,0.92)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] -top-[100px] -right-[50px] rounded-full bg-blue-200/30 blur-[120px] animate-pulse pointer-events-none" />
      <div className="fixed w-[500px] h-[500px] -bottom-[50px] -left-[100px] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse pointer-events-none" />

      <div className="w-full max-w-[800px] animate-fadeUp z-10">
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 md:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-base shadow-lg shadow-blue-600/20">🤝</div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Member Registration</h1>
              </div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Secure Enrollment Portal</p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200 self-start sm:self-center">
              {[1, 2, 3, 4].map(num => (
                <div key={num} className={`flex items-center justify-center w-7 h-7 rounded-xl text-[9px] font-black transition-all duration-500 ${step >= num ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-200 text-gray-600'}`}>
                  {step > num ? '✓' : num}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs text-center font-bold animate-shake uppercase tracking-wider">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" onKeyDown={(e) => { if (e.key === 'Enter' && step < 4) e.preventDefault() }}>
            {step === 1 && (
              <div className="space-y-10 animate-fadeIn">
                <div className="space-y-6">
                  <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Personal & Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField id={sanitizeId('member.fullName')} label="Full Name" name="member.fullName" value={formData.member.fullName} onChange={handleChange} onBlur={handleBlur} error={errors['member.fullName']} touched={touched['member.fullName']} required placeholder="Full Name" aria-invalid={!!errors['member.fullName']} />
                    <InputField id={sanitizeId('email')} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors['email']} touched={touched['email']} required placeholder="john@example.com" aria-invalid={!!errors['email']} />
                    <InputField id={sanitizeId('member.mobile')} label="Mobile Number" name="member.mobile" type="tel" value={formData.member.mobile} onChange={handleChange} onBlur={handleBlur} error={errors['member.mobile']} touched={touched['member.mobile']} required placeholder="9876543210" aria-invalid={!!errors['member.mobile']} />
                    <InputField id={sanitizeId('member.dateOfBirth')} label="Date of Birth" name="member.dateOfBirth" type="date" value={formData.member.dateOfBirth} onChange={handleChange} onBlur={handleBlur} error={errors['member.dateOfBirth']} touched={touched['member.dateOfBirth']} required aria-invalid={!!errors['member.dateOfBirth']} />
                    <InputField id={sanitizeId('member.landline')} label="Landline (Optional)" name="member.landline" value={formData.member.landline} onChange={handleChange} onBlur={handleBlur} error={errors['member.landline']} touched={touched['member.landline']} placeholder="0484-2345678" aria-invalid={!!errors['member.landline']} />

                    <div className="space-y-1">
                      <label htmlFor={sanitizeId('member.officeType')} className="text-gray-700 text-[10px] font-bold uppercase tracking-widest ml-1">Office Type <span className="text-red-500">*</span></label>
                      <select id={sanitizeId('member.officeType')} name="member.officeType" value={formData.member.officeType} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-3.5 text-gray-900 text-sm focus:border-blue-500 outline-none" aria-invalid={!!errors['member.officeType']}>
                        {OFFICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={sanitizeId('member.roleInAgency')} className="text-gray-700 text-[10px] font-bold uppercase tracking-widest ml-1">Role in Agency <span className="text-red-500">*</span></label>
                      <select id={sanitizeId('member.roleInAgency')} name="member.roleInAgency" value={formData.member.roleInAgency} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-3.5 text-gray-900 text-sm focus:border-blue-500 outline-none" aria-invalid={!!errors['member.roleInAgency']}>
                        {ROLES_IN_AGENCY.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 border-t border-gray-200 pt-10">
                  <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Account Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField id={sanitizeId('password')} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors['password']} touched={touched['password']} required placeholder="8+ chars (A-z, 1-9)" aria-invalid={!!errors['password']} />
                    <InputField id={sanitizeId('confirmPassword')} label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors['confirmPassword']} touched={touched['confirmPassword']} required placeholder="Re-enter password" aria-invalid={!!errors['confirmPassword']} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Business Identity</h3>
                  <InputField id={sanitizeId('establishment.name')} label="Establishment Name" name="establishment.name" value={formData.establishment.name} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.name']} touched={touched['establishment.name']} required placeholder="Green Valley Holidays" aria-invalid={!!errors['establishment.name']} />
                  <InputField id={sanitizeId('establishment.tradeName')} label="Trade Name" name="establishment.tradeName" value={formData.establishment.tradeName} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.tradeName']} touched={touched['establishment.tradeName']} required placeholder="GVH Travels" aria-invalid={!!errors['establishment.tradeName']} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField id={sanitizeId('establishment.yearOfEstablishment')} label="Year" name="establishment.yearOfEstablishment" type="number" value={formData.establishment.yearOfEstablishment} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.yearOfEstablishment']} touched={touched['establishment.yearOfEstablishment']} required placeholder="2020" aria-invalid={!!errors['establishment.yearOfEstablishment']} />
                    <div className="space-y-1">
                      <label htmlFor={sanitizeId('establishment.businessType')} className="text-gray-700 text-[10px] font-bold uppercase tracking-widest ml-1">Business Type</label>
                      <select id={sanitizeId('establishment.businessType')} name="establishment.businessType" value={formData.establishment.businessType} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-3.5 text-gray-900 text-sm focus:border-blue-500 outline-none" aria-invalid={!!errors['establishment.businessType']}>
                        {BUSINESS_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={sanitizeId('establishment.officialClassification')} className="text-gray-700 text-[10px] font-bold uppercase tracking-widest ml-1">Official Classification <span className="text-red-500">*</span></label>
                    <select id={sanitizeId('establishment.officialClassification')} name="establishment.officialClassification" value={formData.establishment.officialClassification} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-3.5 text-gray-900 text-sm focus:border-blue-500 outline-none" aria-invalid={!!errors['establishment.officialClassification']}>
                      {OFFICIAL_CLASSIFICATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {formData.establishment.businessType === 'Other' && (
                    <InputField id={sanitizeId('establishment.businessTypeDescription')} label="Please describe your business" name="establishment.businessTypeDescription" value={formData.establishment.businessTypeDescription} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.businessTypeDescription']} touched={touched['establishment.businessTypeDescription']} required placeholder="e.g. Travel Blogger, Photographer, etc." aria-invalid={!!errors['establishment.businessTypeDescription']} />
                  )}
                </div>

                <div className="space-y-5">
                  <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Official Contact</h3>
                  <InputField id={sanitizeId('establishment.officialEmail')} label="Official Email" name="establishment.officialEmail" type="email" value={formData.establishment.officialEmail} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.officialEmail']} touched={touched['establishment.officialEmail']} required placeholder="official@company.com" aria-invalid={!!errors['establishment.officialEmail']} />
                  <InputField id={sanitizeId('establishment.website')} label="Website URL (Optional)" name="establishment.website" type="url" value={formData.establishment.website} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.website']} touched={touched['establishment.website']} placeholder="https://www.company.com" aria-invalid={!!errors['establishment.website']} />
                  <div className="space-y-4 pt-2">
                    <label className="flex items-center gap-3 group cursor-pointer">
                      <input id={sanitizeId('establishment.gstRegistered')} name="establishment.gstRegistered" type="checkbox" checked={formData.establishment.gstRegistered} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10 checked:bg-blue-600 transition-all" />
                      <span className="text-slate-300 text-xs font-semibold">Registered for GST?</span>
                    </label>
                    {formData.establishment.gstRegistered && (
                      <div className="animate-scaleIn">
                        <InputField id={sanitizeId('establishment.gstNumber')} label="GST Number" name="establishment.gstNumber" type="text" value={formData.establishment.gstNumber} onChange={handleChange} onBlur={handleBlur} error={errors['establishment.gstNumber']} touched={touched['establishment.gstNumber']} placeholder="GSTN1234567890" aria-invalid={!!errors['establishment.gstNumber']} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]">Additional Contacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest pl-1">Staff Details (Optional)</p>
                      <InputField id={sanitizeId('staff.name')} label="Staff Contact Person" name="staff.name" value={formData.staff.name} onChange={handleChange} onBlur={handleBlur} placeholder="Staff Full Name" aria-invalid={!!errors['staff.name']} />
                      <InputField id={sanitizeId('staff.mobile')} label="Staff Mobile" name="staff.mobile" value={formData.staff.mobile} onChange={handleChange} onBlur={handleBlur} placeholder="Staff Contact Number" aria-invalid={!!errors['staff.mobile']} />
                    </div>
                    <div className="space-y-4">
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest pl-1">Partner Details</p>
                        <InputField id={sanitizeId('partner.name')} label="Partner Name" name="partner.name" value={formData.partner.name} onChange={handleChange} onBlur={handleBlur} error={errors['partner.name']} touched={touched['partner.name']} required={formData.establishment.officialClassification === 'Partnership'} placeholder="Partner Full Name" aria-invalid={!!errors['partner.name']} />
                        <InputField id={sanitizeId('partner.mobile')} label="Partner Mobile" name="partner.mobile" value={formData.partner.mobile} onChange={handleChange} onBlur={handleBlur} error={errors['partner.mobile']} touched={touched['partner.mobile']} required={formData.establishment.officialClassification === 'Partnership'} placeholder="Partner Contact Number" aria-invalid={!!errors['partner.mobile']} />
                      </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                  <InputField id={sanitizeId('location.state')} label="State" name="location.state" value={formData.location.state} onChange={handleChange} onBlur={handleBlur} error={errors['location.state']} touched={touched['location.state']} required placeholder="Kerala" aria-invalid={!!errors['location.state']} />
                  <InputField id={sanitizeId('location.district')} label="District" name="location.district" value={formData.location.district} onChange={handleChange} onBlur={handleBlur} error={errors['location.district']} touched={touched['location.district']} required placeholder="Ernakulam" aria-invalid={!!errors['location.district']} />
                  <InputField id={sanitizeId('location.city')} label="City" name="location.city" value={formData.location.city} onChange={handleChange} onBlur={handleBlur} error={errors['location.city']} touched={touched['location.city']} required placeholder="Kochi City" aria-invalid={!!errors['location.city']} />
                  <InputField id={sanitizeId('location.region')} label="Region" name="location.region" value={formData.location.region} onChange={handleChange} onBlur={handleBlur} error={errors['location.region']} touched={touched['location.region']} required placeholder="Central Area" aria-invalid={!!errors['location.region']} />
                  <InputField id={sanitizeId('location.pinCode')} label="Pincode" name="location.pinCode" value={formData.location.pinCode} onChange={handleChange} onBlur={handleBlur} error={errors['location.pinCode']} touched={touched['location.pinCode']} required maxLength={6} placeholder="682001" aria-invalid={!!errors['location.pinCode']} />
                </div>

                <InputField id={sanitizeId('location.registeredAddress')} label="Registered Office Address" name="location.registeredAddress" type="textarea" value={formData.location.registeredAddress} onChange={handleChange} onBlur={handleBlur} error={errors['location.registeredAddress']} touched={touched['location.registeredAddress']} required rows="3" placeholder="Enter the complete official address" aria-invalid={!!errors['location.registeredAddress']} />

                  <div className="flex items-center gap-3 px-1">
                    <input id={sanitizeId('location.isSameAddress')} name="location.isSameAddress" type="checkbox" checked={formData.location.isSameAddress} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10" />
                    <span className="text-slate-300 text-xs font-semibold">Communication address is same as registered office</span>
                  </div>

                {!formData.location.isSameAddress && (
                  <InputField id={sanitizeId('location.communicationAddress')} label="Communication Address" name="location.communicationAddress" type="textarea" value={formData.location.communicationAddress} onChange={handleChange} onBlur={handleBlur} rows="3" placeholder="Full address for communications" aria-invalid={!!errors['location.communicationAddress']} />
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10 animate-fadeIn">
                <DocumentsUpload files={files} errors={errors} touched={touched} handleFileChange={handleFileChange} fileErrors={fileErrors} removeShopPhoto={removeShopPhoto} />

                <ReferencesSearch formData={formData} refSearch={refSearch} setRefSearch={setRefSearch} refResults={refResults} isSearching={isSearching} showRefDropdown={showRefDropdown} setShowRefDropdown={setShowRefDropdown} addReference={addReference} removeReference={removeReference} errors={errors} touched={touched} searchContainerRef={searchContainerRef} />

                <div className="flex items-center justify-center p-6 bg-blue-50 rounded-[32px] border border-blue-200">
                  <p className="text-gray-600 text-[10px] font-medium text-center leading-relaxed">By submitting this application, you certify that all information provided is accurate and all documents uploaded are genuine business records.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-200">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="w-full sm:w-auto text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-gray-900 transition-colors py-4">← Previous Step</button>
              ) : (
                <Link to="/" className="w-full sm:w-auto text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-gray-900 transition-colors py-4">← Back to Home</Link>
              )}

              <div className="flex items-center gap-4">
                {step < 4 ? (
                  <button type="button" onClick={nextStep} disabled={loading} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm tracking-wide transition-all hover:bg-blue-500 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20">{loading ? 'Processing...' : `Next Step →`}</button>
                ) : !isEmailVerified ? (
                  showOtpField ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" className="w-32 bg-white border border-gray-300 rounded-2xl px-4 py-4 text-center text-gray-900 text-sm focus:border-blue-500 outline-none" aria-label="OTP code" aria-invalid={!!error} />
                        <button type="button" onClick={handleVerifyOTP} disabled={otp.length !== 6 || loading} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm tracking-wide transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20">{loading ? '...' : 'Verify'}</button>
                      </div>
                      <button type="button" onClick={handleSendOTP} disabled={resendTimer > 0 || loading} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-500 disabled:opacity-50 text-left ml-2">{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Verification Code'}</button>
                    </div>
                  ) : (
                    <button type="button" onClick={handleSendOTP} disabled={loading} className="px-12 py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all hover:bg-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-50">{loading ? 'Sending...' : 'Verify Email'}</button>
                  )
                ) : (
                  <button type="submit" disabled={loading} className="px-12 py-4 bg-green-600 text-white rounded-2xl font-bold text-sm tracking-wide transition-all hover:bg-green-500 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20">{loading ? 'Submitting...' : 'Submit Application'}</button>
                )}
              </div>
            </div>

          </form>
        </div>

        <p className="text-center mt-10 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">Secure Registration System • © 2025 Association</p>
      </div>
    </div>
  )
}

export default MemberRegister
