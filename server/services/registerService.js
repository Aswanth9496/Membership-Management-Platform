const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const checkEmailExists = async (email) => {
  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(400, 'Email already registered');
  }
};

const checkMobileExists = async (mobile) => {
  const user = await User.findOne({ 'member.mobile': mobile });
  if (user) {
    throw new ApiError(400, 'Mobile number already registered');
  }
};

const findReferrer = async (referralCode) => {
  const referrer = await User.findOne({ 'referral.referralCode': referralCode });
  return referrer;
};

const buildUserData = (body) => {
  const { email, password, membershipType, establishment, location, member, partner, staff, documents, referral } = body;

  const userData = {
    email,
    password,
    membershipType: membershipType || 'new',
    establishment: {
      name: establishment.name,
      tradeName: establishment.tradeName,
      yearOfEstablishment: establishment.yearOfEstablishment,
      officialClassification: establishment.officialClassification,
      businessType: establishment.businessType,
      businessTypeDescription: establishment.businessTypeDescription,
      organizationalStatus: establishment.organizationalStatus || 'Active',
      officialEmail: establishment.officialEmail,
      website: establishment.website || undefined,
      gstRegistered: establishment.gstRegistered || false,
      gstNumber: establishment.gstNumber || undefined,
    },
    location: {
      state: location?.state,
      district: location?.district,
      region: location?.region,
      city: location?.city,
      pinCode: location?.pinCode,
      registeredAddress: location?.registeredAddress,
      communicationAddress: (location?.isSameAddress === true || location?.isSameAddress === 'true') ? location?.registeredAddress : location?.communicationAddress,
      isSameAddress: (location?.isSameAddress === true || location?.isSameAddress === 'true'),
    },
    member: {
      officeType: member.officeType,
      roleInAgency: member.roleInAgency,
      fullName: member.fullName,
      dateOfBirth: member.dateOfBirth,
      mobile: member.mobile,
      landline: member.landline || undefined,
    },
    status: 'submitted',
    referral: referral || { references: [] }
  };

  if (partner && partner.name) {
    userData.partner = {
      name: partner.name,
      mobile: partner.mobile || undefined,
    };
  }

  if (staff && staff.name) {
    userData.staff = {
      name: staff.name,
      mobile: staff.mobile || undefined,
    };
  }

  if (documents) {
    userData.documents = {};
    const docFields = [
      'agencyAddressProof',
      'activityLicense',
      'shopPhoto',
      'businessCard',
      'agencyLogo',
      'memberPhoto',
      'additionalDoc'
    ];

    docFields.forEach(field => {
      if (documents[field]) {
        userData.documents[field] = {
          url: documents[field].url,
          publicId: documents[field].publicId,
          uploadedAt: documents[field].uploadedAt || new Date(),
        };
      }
    });
  }

  return userData;
};

const handleReferral = async (userData, referralCode) => {
  if (referralCode) {
    const referrer = await findReferrer(referralCode);
    if (referrer) {
      userData.referral = {
        ...userData.referral,
        referredBy: referrer._id,
      };
      return referrer;
    }
  }
  return null;
};

const updateReferrerList = async (referrer, newUserId) => {
  if (referrer) {
    referrer.referral.referredMembers.push(newUserId);
    await referrer.save();
  }
};

const formatUserResponse = (user) => {
  return {
    id: user._id,
    email: user.email,
    membershipType: user.membershipType,
    status: user.status,
    statusMessage: 'Submitted – Document Verification Pending',
    establishmentName: user.establishment.name,
    tradeName: user.establishment.tradeName,
    memberName: user.member.fullName,
    mobile: user.member.mobile,
    referralCode: user.referral.referralCode,
    documentsUploaded: {
      agencyAddressProof: !!user.documents?.agencyAddressProof?.url,
      shopPhoto: !!user.documents?.shopPhoto?.url,
      businessCard: !!user.documents?.businessCard?.url,
    },
    createdAt: user.createdAt,
  };
};

const { createReferenceRequests } = require('./referenceService');

const registerUser = async (body) => {
  const { email, member, referredBy } = body;

  await checkEmailExists(email);

  if (member.mobile) {
    await checkMobileExists(member.mobile);
  }

  const userData = buildUserData(body);
  const referrer = await handleReferral(userData, referredBy);

  const user = await User.create(userData);

  user.generateReferralCode();
  await user.save();

  if (referrer && userData.referral) {
    await updateReferrerList(referrer, user._id);
  }

  // Trigger reference verification workflow
  if (user.referral?.references?.length > 0) {
    console.log(`Triggering reference requests for user ${user._id}. References: ${user.referral.references.length}`);
    // We don't await this to keep registration fast, or we can await it if we want to ensure emails sent
    createReferenceRequests(user._id, user.referral.references).catch(err => {
      console.error('CRITICAL: Reference request creation failed:', err);
    });
  } else {
    console.log(`No references found for user ${user._id}`);
  }

  return user;
};

module.exports = {
  checkEmailExists,
  checkMobileExists,
  findReferrer,
  buildUserData,
  handleReferral,
  updateReferrerList,
  formatUserResponse,
  registerUser,
};
