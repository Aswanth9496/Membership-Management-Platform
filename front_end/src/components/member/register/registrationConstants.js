export const BUSINESS_TYPES = [
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

export const OFFICE_TYPES = ['Head Office', 'Branch Office', 'Regional Office', 'Other'];
export const ROLES_IN_AGENCY = ['Owner', 'Partner', 'Director', 'Manager', 'Authorized Representative', 'Other'];
export const OFFICIAL_CLASSIFICATIONS = ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'];

// Fields that belong to each step — used to clear touched state on step entry
export const STEP_FIELDS = {
  1: ['email', 'password', 'confirmPassword', 'member.fullName', 'member.roleInAgency', 'member.officeType', 'member.mobile', 'member.landline', 'member.dateOfBirth'],
  2: ['establishment.name', 'establishment.tradeName', 'establishment.officialClassification', 'establishment.officialEmail', 'establishment.yearOfEstablishment', 'establishment.businessTypeDescription', 'establishment.website', 'establishment.gstNumber', 'partner.name', 'partner.mobile'],
  3: ['location.state', 'location.district', 'location.city', 'location.region', 'location.pinCode', 'location.registeredAddress', 'location.communicationAddress'],
  4: ['agencyAddressProof', 'activityLicense', 'shopPhoto', 'businessCard', 'agencyLogo', 'memberPhoto', 'additionalDoc', 'references'],
};
