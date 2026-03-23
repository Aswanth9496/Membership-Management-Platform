const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Bulk import members from a JSON array.
 * Each record is mapped to the User schema.
 * Duplicates (by email) are skipped, not overwritten.
 *
 * Expected body: { members: [ {...}, {...} ] }
 * Optional per-record default password: record.password (plain text)
 * Falls back to: "Member@1234" if no password provided
 */
const bulkImportMembers = async (membersArray) => {
  const results = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const DEFAULT_PASSWORD = 'Member@1234';

  for (let i = 0; i < membersArray.length; i++) {
    const raw = membersArray[i];

    try {
      // --- Duplicate check ---
      const email = (raw.email || raw.officialEmail || '').toLowerCase().trim();
      if (!email) {
        results.failed++;
        results.errors.push({ index: i, reason: 'Missing email', raw: raw.establishment?.name || 'unknown' });
        continue;
      }

      const exists = await User.findOne({ email }).lean();
      if (exists) {
        results.skipped++;
        continue;
      }

      // --- Hash password ---
      const plainPassword = raw.password || DEFAULT_PASSWORD;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // --- Map fields ---
      const userData = {
        email,
        password: hashedPassword,

        membershipNumber: raw.membershipNumber || undefined,
        membershipType: raw.membershipType || 'new',

        establishment: {
          name: raw.establishment?.name || raw.agencyName || 'N/A',
          tradeName: raw.establishment?.tradeName || raw.tradeName || raw.establishment?.name || raw.agencyName || 'N/A',
          yearOfEstablishment: raw.establishment?.yearOfEstablishment || raw.yearOfEstablishment || 2000,
          officialClassification: raw.establishment?.officialClassification || raw.officialClassification || 'Other',
          businessType: raw.establishment?.businessType || raw.businessType || 'Service',
          businessTypeDescription: raw.establishment?.businessTypeDescription || raw.businessTypeDescription || '',
          organizationalStatus: raw.establishment?.organizationalStatus || raw.organizationalStatus || 'Active',
          officialEmail: raw.establishment?.officialEmail || raw.officialEmail || email,
          website: raw.establishment?.website || raw.website || '',
          gstRegistered: raw.establishment?.gstRegistered ?? raw.gstRegistered ?? false,
          gstNumber: raw.establishment?.gstNumber || raw.gstNumber || '',
        },

        location: {
          state: raw.location?.state || raw.state || '',
          district: raw.location?.district || raw.district || '',
          region: raw.location?.region || raw.region || raw.location?.district || raw.district || 'N/A',
          city: raw.location?.city || raw.city || 'N/A',
          pinCode: String(raw.location?.pinCode || raw.pinCode || '000000').replace(/\D/g, '').padEnd(6, '0').slice(0, 6),
          registeredAddress: raw.location?.registeredAddress || raw.registeredAddress || raw.address || 'N/A',
          communicationAddress: raw.location?.communicationAddress || raw.communicationAddress || '',
          isSameAddress: raw.location?.isSameAddress ?? raw.isSameAddress ?? true,
        },

        member: {
          officeType: raw.member?.officeType || raw.officeType || 'Head Office',
          roleInAgency: raw.member?.roleInAgency || raw.roleInAgency || 'Owner',
          fullName: raw.member?.fullName || raw.fullName || raw.name || 'N/A',
          dateOfBirth: raw.member?.dateOfBirth || raw.dateOfBirth
            ? new Date(raw.member?.dateOfBirth || raw.dateOfBirth)
            : new Date('1990-01-01'),
          mobile: String(raw.member?.mobile || raw.mobile || '9000000000').replace(/\D/g, '').slice(-10).padStart(10, '9'),
          landline: raw.member?.landline || raw.landline || '',
        },

        partner: {
          name: raw.partner?.name || raw.partnerName || '',
          mobile: raw.partner?.mobile || raw.partnerMobile || '',
        },

        staff: {
          name: raw.staff?.name || raw.staffName || '',
          mobile: raw.staff?.mobile || raw.staffMobile || '',
        },

        status: raw.status || 'approved',
        isEmailVerified: raw.isEmailVerified ?? true,
        isMobileVerified: raw.isMobileVerified ?? false,
        isActive: raw.isActive ?? true,

        payment: {
          status: raw.payment?.status || 'pending',
          type: raw.payment?.type || raw.membershipType || 'new',
          amount: raw.payment?.amount || raw.paymentAmount || 0,
        },

        certificate: raw.certificate || {},
      };

      const user = new User(userData);

      // Generate membership number if not provided
      if (!userData.membershipNumber) {
        user.generateMembershipNumber();
      }

      // Save with validation bypassed for legacy data tolerance
      await user.save({ validateBeforeSave: false });

      results.imported++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        index: i,
        reason: err.message,
        raw: raw.establishment?.name || raw.email || `Record #${i}`,
      });
    }
  }

  return results;
};

module.exports = { bulkImportMembers };
