import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const BUSINESS_TYPES = [
  'Travel Agent',
  'Tour Operator',
  'Online Travel Agency (OTA)',
  'Visa Processing / Documentation Service',
  'Hajj & Umrah Service Provider',
  'Inbound Tour Operator',
  'Outbound Tour Operator',
  'Domestic Tour Operator',
  'Holiday Package Provider',
  'Hotel Booking / Accommodation Provider',
  'Transport / Car Rental Service',
  'Cruise / Houseboat Booking Agent',
  'Travel Insurance Agent',
  'MICE Operator (Meetings, Incentives, Conferences & Exhibitions)',
  'Adventure Tourism Operator',
  'Eco Tourism Operator',
  'Travel Technology Provider (Software / API / Booking Systems)',
  'Tourism Promotion Organization',
  'Destination Management Company (DMC)',
  'Other'
];

const OFFICE_TYPES = ['Head Office', 'Branch Office', 'Regional Office', 'Other'];
const ROLES_IN_AGENCY = ['Owner', 'Partner', 'Director', 'Manager', 'Authorized Representative', 'Other'];
const OFFICIAL_CLASSIFICATIONS = ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'];


const InputField = ({ label, name, type = "text", value, onChange, onBlur, placeholder, error, touched, required, ...props }) => (
  <div className="space-y-1">
    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-white/5 border ${error && touched ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'} rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:bg-white/[0.08] outline-none`}
        {...props}
      />
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-white/5 border ${error && touched ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'} rounded-2xl px-5 py-3.5 text-white text-sm transition-all focus:bg-white/[0.08] outline-none`}
        {...props}
      />
    )}
    {error && touched && (
      <p className="text-red-500 text-[9px] font-bold uppercase tracking-tighter ml-1 animate-fadeIn">{error}</p>
    )}
  </div>
);

const MemberRegister = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
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
      roleInAgency: 'Owner',
      fullName: '',
      dateOfBirth: '',
      mobile: '',
      landline: '',
    },
    partner: { name: '', mobile: '' },
    staff: { name: '', mobile: '' },
    references: [], // Stores matching member objects: { _id, name, company }
  })

  const [files, setFiles] = useState({
    agencyAddressProof: null,
    activityLicense: null,
    shopPhoto: null,
    businessCard: null,
    agencyLogo: null,
    memberPhoto: null,
    additionalDoc: null,
  })

  const [refSearch, setRefSearch] = useState('')
  const [refResults, setRefResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showRefDropdown, setShowRefDropdown] = useState(false)
  const searchContainerRef = useRef(null)

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('registration_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const parsedData = parsed.formData || parsed;

        // Function to deeply merge to preserve default structures
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

        setFormData(prev => ({
          ...merge(prev, parsedData),
          password: '', // Security: don't restore passwords
          confirmPassword: '',
        }));
        if (parsed.step) setStep(parsed.step);
      } catch (e) {
        console.error("Failed to load saved registration data", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    // Save only essential fields, excludes passwords for extra safety although standard in some UX
    const { password, confirmPassword, ...dataToSave } = formData;
    localStorage.setItem('registration_form', JSON.stringify({
      formData: dataToSave,
      step
    }));
  }, [formData, step]);

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
  }, [step])

  // Member Reference Search
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
          setRefResults(response.data.members.filter(m =>
            !formData.references.some(r => r._id === m._id)
          ))
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
      references: [...prev.references, {
        _id: member._id,
        name: member.member?.fullName || member.name, // Handle both structures
        company: member.establishment?.name || member.company
      }]
    }))
    setRefSearch('')
    setRefResults([])
    setShowRefDropdown(false)
  }

  const removeReference = (id) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter(r => r._id !== id)
    }))
  }

  const validateField = (name, value) => {
    let error = ''

    // Step 1: Account & Personal
    if (name === 'email' && !/^\S+@\S+\.\S+$/.test(value)) error = 'Valid email is required'
    if (name === 'password' && value.length < 8) error = 'Password must be at least 8 characters'
    if (name === 'password' && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) error = 'Must have uppercase, lowercase and number'
    if (name === 'confirmPassword' && value !== formData.password) error = 'Passwords do not match'
    if (name === 'member.fullName' && !value.trim()) error = 'Full name is required'
    if (name === 'member.roleInAgency' && !value.trim()) error = 'Role is required'
    if (name === 'member.officeType' && !value.trim()) error = 'Office type is required'
    if (name === 'member.mobile' && !/^[6-9]\d{9}$/.test(value)) error = 'Valid 10-digit mobile required'
    if (name === 'member.landline' && value && !/^\d{8,15}$/.test(value)) error = 'Invalid landline number'
    if (name === 'member.dateOfBirth' && !value) error = 'Date of birth is required'

    // Step 2: Establishment
    if (name === 'establishment.name' && !value.trim()) error = 'Establishment name is required'
    if (name === 'establishment.tradeName' && !value.trim()) error = 'Trade name is required'
    if (name === 'establishment.officialClassification' && !value.trim()) error = 'Official classification is required'
    if (name === 'establishment.yearOfEstablishment' && (!value || value < 1800 || value > new Date().getFullYear())) error = 'Invalid year'
    if (name === 'establishment.officialEmail' && !/^\S+@\S+\.\S+$/.test(value)) error = 'Valid official email required'
    if (name === 'establishment.businessTypeDescription' && formData.establishment.businessType === 'Other' && !value.trim()) error = 'Description is required'
    if (name === 'establishment.website' && value && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value)) error = 'Invalid website URL'


    // Step 3: Location
    if (name === 'location.state' && !value.trim()) error = 'State is required'
    if (name === 'location.district' && !value.trim()) error = 'District is required'
    if (name === 'location.city' && !value.trim()) error = 'City is required'
    if (name === 'location.region' && !value.trim()) error = 'Location/Region is required'
    if (name === 'location.pinCode' && !/^\d{6}$/.test(value)) error = 'Valid 6-digit Pincode required'
    if (name === 'location.registeredAddress' && !value.trim()) error = 'Registered office address is required'
    
    // References (Special check)
    if (name === 'references' && (!value || value.length === 0)) error = 'At least one reference is mandatory'

    setErrors(prev => ({ ...prev, [name]: error }))
    return error === ''
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }))
      setTouched(prev => ({ ...prev, [name]: true }))
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value

    if (name === 'location.pinCode') {
      finalValue = value.replace(/\D/g, '').slice(0, 6)
    }

    if (name.includes('.')) {
      const [section, field] = name.split('.')
      setFormData(prev => {
        const newState = {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: finalValue
          }
        };
        if (field === 'businessType' && value !== 'Other') {
          newState[section].businessTypeDescription = '';
        }
        return newState;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }))
    }

    if (touched[name]) {
      validateField(name, finalValue)
    }
    if (error) setError(null)
  }

  const validateStep = () => {
    const stepErrors = {}
    let isValid = true

    const check = (name, value) => {
      if (!validateField(name, value)) {
        isValid = false
        stepErrors[name] = errors[name] || 'Required'
      }
    }

    if (step === 1) {
      check('email', formData.email)
      check('password', formData.password)
      check('confirmPassword', formData.confirmPassword)
      check('member.fullName', formData.member.fullName)
      check('member.roleInAgency', formData.member.roleInAgency)
      check('member.officeType', formData.member.officeType)
      check('member.mobile', formData.member.mobile)
      check('member.dateOfBirth', formData.member.dateOfBirth)
    } else if (step === 2) {
      check('establishment.name', formData.establishment.name)
      check('establishment.tradeName', formData.establishment.tradeName)
      check('establishment.officialClassification', formData.establishment.officialClassification)
      check('establishment.officialEmail', formData.establishment.officialEmail)
      check('establishment.yearOfEstablishment', formData.establishment.yearOfEstablishment)
      if (formData.establishment.businessType === 'Other') {
        check('establishment.businessTypeDescription', formData.establishment.businessTypeDescription)
      }
    } else if (step === 3) {
      check('location.state', formData.location.state)
      check('location.district', formData.location.district)
      check('location.city', formData.location.city)
      check('location.region', formData.location.region)
      check('location.pinCode', formData.location.pinCode)
      check('location.registeredAddress', formData.location.registeredAddress)
    } else if (step === 4) {
      if (!files.agencyAddressProof) { isValid = false; stepErrors['agencyAddressProof'] = 'Agency address proof is required'; }
      if (!files.activityLicense) { isValid = false; stepErrors['activityLicense'] = 'Activity license is required'; }
      if (!files.shopPhoto) { isValid = false; stepErrors['shopPhoto'] = 'Shop photo is required'; }
      if (!files.businessCard) { isValid = false; stepErrors['businessCard'] = 'Business card is required'; }
      if (!files.agencyLogo) { isValid = false; stepErrors['agencyLogo'] = 'Agency logo is required'; }
      if (!files.memberPhoto) { isValid = false; stepErrors['memberPhoto'] = 'Main member photo is required'; }
      
      // Added reference check in step 4
      check('references', formData.references)
    }

    if (!isValid) {
      setError('Please correct the errors before proceeding')
      const allTouched = {}
      Object.keys(stepErrors).forEach(key => allTouched[key] = true)
      setTouched(prev => ({ ...prev, ...allTouched }))
    } else {
      setError(null)
    }

    return isValid
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

    // Final step validation
    if (!validateStep()) return

    console.log("Submitting form data:", formData);
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

      // Remove fields handled separately or not needed by backend
      const { confirmPassword, references, ...submitData } = formData

      // Ensure communication address is handled if same as registered
      if (submitData.location.isSameAddress) {
        submitData.location.communicationAddress = submitData.location.registeredAddress;
      }

      flatten(submitData)

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key])
      })

      // Append references correctly as string of IDs
      if (formData.references && formData.references.length > 0) {
        data.append('references', formData.references.map(r => r._id).join(','))
      }

      const response = await memberEndpoints.registration.register(data)


      if (response && response.success) {
        setSuccess(true)
        localStorage.removeItem('registration_form'); // Clear persistence on success
        window.scrollTo(0, 0)
      } else {
        const errorMsg = response?.data?.errors?.join(', ') || response?.message || 'Registration failed'
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Registration error:', err)
      const serverMessage = err.message || 'An error occurred during registration.'
      const serverData = err.data; // From api.js interceptor
      const serverErrors = serverData?.errors;

      let topError = serverMessage;
      const newErrors = { ...errors };
      const newTouched = { ...touched };

      // Map specific backend business logic errors to fields
      if (serverMessage.toLowerCase().includes('mobile number')) {
        newErrors['member.mobile'] = serverMessage;
        newTouched['member.mobile'] = true;
        setStep(1);
      } else if (serverMessage.toLowerCase().includes('email already registered')) {
        newErrors['email'] = serverMessage;
        newTouched['email'] = true;
        setStep(1);
      }

      // Map validation errors array if present
      if (serverErrors && Array.isArray(serverErrors)) {
        serverErrors.forEach(msg => {
          if (msg.includes('Pin code')) {
            newErrors['location.pinCode'] = msg;
            newTouched['location.pinCode'] = true;
            if (step > 3) setStep(3);
          } else if (msg.includes('GST number')) {
            newErrors['establishment.gstNumber'] = msg;
            newTouched['establishment.gstNumber'] = true;
            if (step > 2) setStep(2);
          }
          // Add more mappings as discovered or needed
        });
        topError = serverErrors.join(' • ');
      }

      setErrors(newErrors);
      setTouched(newTouched);
      setError(topError);
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
            {/* STEP 1: ACCOUNT & PERSONAL DETAILS */}
            {step === 1 && (
              <div className="space-y-10 animate-fadeIn">
                {/* Personal & Contact Section */}
                <div className="space-y-6">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Personal & Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField
                      label="Full Name"
                      name="member.fullName"
                      value={formData.member.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['member.fullName']}
                      touched={touched['member.fullName']}
                      required
                      placeholder="Arjun Raghavan"
                    />
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['email']}
                      touched={touched['email']}
                      required
                      placeholder="john@example.com"
                    />
                    <InputField
                      label="Mobile Number"
                      name="member.mobile"
                      type="tel"
                      value={formData.member.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['member.mobile']}
                      touched={touched['member.mobile']}
                      required
                      placeholder="9876543210"
                    />
                    <InputField
                      label="Date of Birth"
                      name="member.dateOfBirth"
                      type="date"
                      value={formData.member.dateOfBirth}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['member.dateOfBirth']}
                      touched={touched['member.dateOfBirth']}
                      required
                    />
                    <InputField
                      label="Landline (Optional)"
                      name="member.landline"
                      value={formData.member.landline}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['member.landline']}
                      touched={touched['member.landline']}
                      placeholder="0484-2345678"
                    />
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Office Type <span className="text-red-500">*</span></label>
                      <select name="member.officeType" value={formData.member.officeType} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:border-blue-500 outline-none">
                        {OFFICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Role in Agency <span className="text-red-500">*</span></label>
                      <select name="member.roleInAgency" value={formData.member.roleInAgency} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:border-blue-500 outline-none">
                        {ROLES_IN_AGENCY.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Account Security Section */}
                <div className="space-y-6 border-t border-white/5 pt-10">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Account Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['password']}
                      touched={touched['password']}
                      required
                      placeholder="8+ chars (A-z, 1-9)"
                    />
                    <InputField
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['confirmPassword']}
                      touched={touched['confirmPassword']}
                      required
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ESTABLISHMENT */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fadeIn">
                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Business Identity</h3>
                  <InputField
                    label="Establishment Name"
                    name="establishment.name"
                    value={formData.establishment.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['establishment.name']}
                    touched={touched['establishment.name']}
                    required
                    placeholder="Green Valley Holidays"
                  />
                  <InputField
                    label="Trade Name"
                    name="establishment.tradeName"
                    value={formData.establishment.tradeName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['establishment.tradeName']}
                    touched={touched['establishment.tradeName']}
                    required
                    placeholder="GVH Travels"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Year"
                      name="establishment.yearOfEstablishment"
                      type="number"
                      value={formData.establishment.yearOfEstablishment}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['establishment.yearOfEstablishment']}
                      touched={touched['establishment.yearOfEstablishment']}
                      required
                      placeholder="2020"
                    />
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Business Type</label>
                      <select name="establishment.businessType" value={formData.establishment.businessType} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:border-blue-500 outline-none">
                        {BUSINESS_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Official Classification <span className="text-red-500">*</span></label>
                    <select name="establishment.officialClassification" value={formData.establishment.officialClassification} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:border-blue-500 outline-none">
                      {OFFICIAL_CLASSIFICATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {formData.establishment.businessType === 'Other' && (
                    <InputField
                      label="Please describe your business"
                      name="establishment.businessTypeDescription"
                      value={formData.establishment.businessTypeDescription}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors['establishment.businessTypeDescription']}
                      touched={touched['establishment.businessTypeDescription']}
                      required
                      placeholder="e.g. Travel Blogger, Photographer, etc."
                    />
                  )}
                </div>

                <div className="space-y-5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Official Contact</h3>
                  <InputField
                    label="Official Email"
                    name="establishment.officialEmail"
                    type="email"
                    value={formData.establishment.officialEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['establishment.officialEmail']}
                    touched={touched['establishment.officialEmail']}
                    required
                    placeholder="official@company.com"
                  />
                  <InputField
                    label="Website URL (Optional)"
                    name="establishment.website"
                    type="url"
                    value={formData.establishment.website}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['establishment.website']}
                    touched={touched['establishment.website']}
                    placeholder="https://www.company.com"
                  />
                  <div className="space-y-4 pt-2">
                    <label className="flex items-center gap-3 group cursor-pointer">
                      <input name="establishment.gstRegistered" type="checkbox" checked={formData.establishment.gstRegistered} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10 checked:bg-blue-600 transition-all" />
                      <span className="text-slate-300 text-xs font-semibold">Registered for GST?</span>
                    </label>
                    {formData.establishment.gstRegistered && (
                      <div className="animate-scaleIn">
                        <InputField
                          label="GST Number"
                          name="establishment.gstNumber"
                          type="text"
                          value={formData.establishment.gstNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors['establishment.gstNumber']}
                          touched={touched['establishment.gstNumber']}
                          placeholder="GSTN1234567890"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]">Additional Contacts (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest pl-1">Partner Details</p>
                      <InputField
                        label="Partner Name"
                        name="partner.name"
                        value={formData.partner.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Partner Full Name"
                      />
                      <InputField
                        label="Partner Mobile"
                        name="partner.mobile"
                        value={formData.partner.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Partner Contact Number"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest pl-1">Staff Details</p>
                      <InputField
                        label="Staff Contact Person"
                        name="staff.name"
                        value={formData.staff.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Staff Full Name"
                      />
                      <InputField
                        label="Staff Mobile"
                        name="staff.mobile"
                        value={formData.staff.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Staff Contact Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ADDRESS & LOCATION */}
            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                  <InputField
                    label="State"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['location.state']}
                    touched={touched['location.state']}
                    required
                    placeholder="Kerala"
                  />
                  <InputField
                    label="District"
                    name="location.district"
                    value={formData.location.district}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['location.district']}
                    touched={touched['location.district']}
                    required
                    placeholder="Ernakulam"
                  />
                  <InputField
                    label="City"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['location.city']}
                    touched={touched['location.city']}
                    required
                    placeholder="Kochi City"
                  />
                  <InputField
                    label="Region"
                    name="location.region"
                    value={formData.location.region}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['location.region']}
                    touched={touched['location.region']}
                    required
                    placeholder="Central Area"
                  />
                  <InputField
                    label="Pincode"
                    name="location.pinCode"
                    value={formData.location.pinCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors['location.pinCode']}
                    touched={touched['location.pinCode']}
                    required
                    maxLength={6}
                    placeholder="682001"
                  />
                </div>

                <InputField
                  label="Registered Office Address"
                  name="location.registeredAddress"
                  type="textarea"
                  value={formData.location.registeredAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors['location.registeredAddress']}
                  touched={touched['location.registeredAddress']}
                  required
                  rows="3"
                  placeholder="Enter the complete official address"
                />

                <div className="flex items-center gap-3 px-1">
                  <input name="location.isSameAddress" type="checkbox" checked={formData.location.isSameAddress} onChange={handleChange} className="w-5 h-5 rounded-lg bg-white/5 border-white/10" />
                  <span className="text-slate-300 text-xs font-semibold">Communication address is same as registered office</span>
                </div>

                {!formData.location.isSameAddress && (
                  <InputField
                    label="Communication Address"
                    name="location.communicationAddress"
                    type="textarea"
                    value={formData.location.communicationAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    placeholder="Full address for communications"
                  />
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10 animate-fadeIn">
                {/* Documents Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h2 className="text-white text-sm font-bold uppercase tracking-widest">Verification Documents</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(files).map((key) => (
                      <div key={key} className="space-y-4">
                        <div className={`bg-slate-800/10 border ${errors[key] && touched[key] ? 'border-red-500/50' : 'border-white/5'} rounded-3xl p-6 transition-all hover:bg-slate-800/20 hover:border-blue-500/30 group relative min-h-[140px] flex items-center justify-center`}>
                          <div className="text-center group-hover:scale-105 transition-transform duration-500">
                            <div className="text-xl mb-2">
                              {key === 'agencyLogo' ? '🖼️' : key === 'memberPhoto' ? '👤' : '📄'}
                            </div>
                            <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 pointer-events-none">
                              {key === 'agencyAddressProof' && 'Agency Address Proof'}
                              {key === 'activityLicense' && 'Activity License'}
                              {key === 'shopPhoto' && 'Shop Photo'}
                              {key === 'businessCard' && 'Business Card'}
                              {key === 'agencyLogo' && 'Agency Logo'}
                              {key === 'memberPhoto' && 'Main Member Photo'}
                              {key === 'additionalDoc' && 'Additional Document'}
                            </p>
                            <p className="text-slate-500 text-[8px] uppercase tracking-tighter pointer-events-none">
                              {key === 'shopPhoto' ? 'Visible Name Board & Open Sign' : 'JPG, PNG or PDF • 5MB'}
                            </p>
                          </div>
                          <input
                            type="file"
                            name={key}
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            accept=".jpg,.jpeg,.png,.pdf"
                          />
                          {files[key] ? (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-blue-400 text-[8px] font-bold uppercase bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 animate-scaleIn">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              {files[key].name.length > 15 ? files[key].name.substring(0, 15) + '...' : files[key].name}
                            </div>
                          ) : errors[key] && touched[key] ? (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-red-500 text-[8px] font-bold uppercase bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 animate-scaleIn">
                              Required
                            </div>
                          ) : key === 'additionalDoc' && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-slate-500 text-[8px] font-bold uppercase bg-slate-500/5 px-2 py-1 rounded-lg border border-white/5">
                              Optional
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reference Section */}
                <div className="space-y-6 pt-10 border-t border-white/5 relative">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      <h2 className="text-white text-sm font-bold uppercase tracking-widest">Member References <span className="text-red-500">*</span></h2>
                    </div>
                    <span className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                      errors['references'] && touched['references'] 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-white/5 border-white/5 text-slate-500'
                    }`}>
                      {formData.references.length === 0 ? 'Verification Required' : `${formData.references.length} Reference(s) Added`}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div ref={searchContainerRef} className="relative group">
                      {/* Search Bar with Chips */}
                      <div
                        className={`min-h-[64px] bg-white/5 border ${formData.references.length >= 2 ? 'border-white/5 opacity-60 cursor-not-allowed' : 'border-white/10 focus-within:border-blue-500/50 hover:border-white/20'} rounded-[24px] px-4 py-3 transition-all flex flex-wrap gap-2 items-center`}
                        onClick={() => formData.references.length < 2 && setShowRefDropdown(true)}
                      >
                        <span className="text-slate-500 ml-2">🔍</span>

                        {/* Selected Chips inside search bar area */}
                        {formData.references.map((ref) => (
                          <div key={ref._id} className="bg-blue-600/20 border border-blue-500/30 rounded-xl pl-3 pr-2 py-1.5 flex items-center gap-2 group/chip animate-scaleIn">
                            <span className="text-white text-[10px] font-bold uppercase tracking-tight">{ref.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeReference(ref._id);
                              }}
                              className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all transform active:scale-90"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {formData.references.length < 2 && (
                          <input
                            type="text"
                            placeholder={formData.references.length === 0 ? "Search by member name, agency or ID..." : "Add second reference..."}
                            value={refSearch}
                            onChange={(e) => {
                              setRefSearch(e.target.value);
                              setShowRefDropdown(true);
                            }}
                            onFocus={() => setShowRefDropdown(true)}
                            className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 outline-none min-w-[200px] h-full"
                          />
                        )}

                        {formData.references.length >= 2 && (
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest ml-2 italic">
                            Maximum references reached
                          </span>
                        )}

                        {isSearching && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      {/* Google-style Prediction Dropdown */}
                      {showRefDropdown && (refSearch.length >= 2 || (refResults.length > 0 && !refSearch)) && (
                        <div className="absolute z-50 top-full mt-3 w-full bg-[#0f172a] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-scaleIn origin-top-center p-2 backdrop-blur-xl">
                          {refResults.length > 0 ? (
                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-3 border-b border-white/5">Suggested Partners</p>
                              {refResults.map((member) => (
                                <button
                                  key={member._id}
                                  type="button"
                                  onClick={() => addReference(member)}
                                  className="w-full text-left px-5 py-4 hover:bg-blue-600/10 rounded-2xl transition-all border-b border-white/5 last:border-0 flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-lg group-hover:bg-blue-600/20 group-hover:scale-110 transition-all duration-300">
                                      👤
                                    </div>
                                    <div>
                                      <p className="text-white text-xs font-bold mb-0.5 group-hover:text-blue-400 transition-colors uppercase tracking-wide">
                                        {member.member?.fullName || member.name}
                                      </p>
                                      <p className="text-slate-400 text-[9px] uppercase tracking-tighter flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-blue-500/80 font-bold">{member.establishment?.name || member.company}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                        <span>{member.membershipNumber}</span>
                                        {member.email && (
                                          <>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="opacity-60 lowercase">{member.email}</span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                    ➕
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : refSearch.length >= 2 ? (
                            <div className="p-8 text-center">
                              <div className="text-2xl mb-2 opacity-20">🔍</div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">No members found matching "{refSearch}"</p>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Type to search existing members</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {errors['references'] && touched['references'] && (
                        <p className="absolute -bottom-6 left-4 text-red-500 text-[9px] font-bold uppercase tracking-tighter animate-fadeIn">
                          {errors['references']}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 px-1">
                      <div className="flex items-center gap-2 text-slate-500 text-[9px] font-medium uppercase tracking-widest opacity-70">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Trusted Network
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[9px] font-medium uppercase tracking-widest opacity-70">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Real-time verification
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center p-6 bg-blue-600/5 rounded-[32px] border border-blue-500/10">
                  <p className="text-slate-400 text-[10px] font-medium text-center leading-relaxed">
                    By submitting this application, you certify that all information provided is accurate and all documents uploaded are genuine business records.
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
                    key="btn-next"
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl px-10 py-4 font-bold text-xs tracking-[0.1em] uppercase transition-all hover:bg-blue-500 hover:-translate-y-0.5 shadow-lg shadow-blue-600/20"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    key="btn-submit"
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
