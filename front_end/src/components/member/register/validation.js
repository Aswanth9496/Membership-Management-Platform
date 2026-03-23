export const validateField = (formData, name, value) => {
  let error = ''

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

  if (name === 'establishment.name' && !value.trim()) error = 'Establishment name is required'
  if (name === 'establishment.tradeName' && !value.trim()) error = 'Trade name is required'
  if (name === 'establishment.officialClassification' && !value.trim()) error = 'Official classification is required'
  if (name === 'establishment.yearOfEstablishment' && (!value || value < 1800 || value > new Date().getFullYear())) error = 'Invalid year'
  if (name === 'establishment.officialEmail' && !/^\S+@\S+\.\S+$/.test(value)) error = 'Valid official email required'
  if (name === 'establishment.businessTypeDescription' && formData.establishment.businessType === 'Other' && !value.trim()) error = 'Description is required'
  if (name === 'establishment.website' && value && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(value)) error = 'Invalid website URL'

  if (name === 'partner.name' && formData.establishment.officialClassification === 'Partnership' && !value.trim()) error = 'Partner name is required'
  if (name === 'partner.mobile' && formData.establishment.officialClassification === 'Partnership' && !/^[6-9]\d{9}$/.test(value)) error = 'Valid 10-digit mobile required'

  if (name === 'location.state' && !value.trim()) error = 'State is required'
  if (name === 'location.district' && !value.trim()) error = 'District is required'
  if (name === 'location.city' && !value.trim()) error = 'City is required'
  if (name === 'location.region' && !value.trim()) error = 'Location/Region is required'
  if (name === 'location.pinCode' && !/^\d{6}$/.test(value)) error = 'Valid 6-digit Pincode required'
  if (name === 'location.registeredAddress' && !value.trim()) error = 'Registered office address is required'

  if (name === 'references' && (!value || value.length === 0)) error = 'At least one reference is mandatory'

  return error
}

export const validateStep = (step, formData, files) => {
  const stepErrors = {}
  let isValid = true

  const check = (name, value) => {
    const err = validateField(formData, name, value)
    if (err) {
      isValid = false
      stepErrors[name] = err
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
    if (formData.establishment.officialClassification === 'Partnership') {
      check('partner.name', formData.partner.name)
      check('partner.mobile', formData.partner.mobile)
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
    check('references', formData.references)
  }

  return { isValid, stepErrors }
}
