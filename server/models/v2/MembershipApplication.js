const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserV2',
      required: true,
    },
    membershipType: {
      type: String,
      enum: ['new', 'renewal'],
      default: 'new',
    },
    membershipNumber: String,
    
    // BUSINESS DETAILS
    establishment: {
      name: String,
      tradeName: String,
      yearOfEstablishment: Number,
      officialClassification: String,
      businessType: String,
      businessTypeDescription: String,
      officialEmail: String,
      website: String,
      gstNumber: String,
    },

    // LOCATION
    location: {
      district: String,
      region: String,
      city: String,
      pinCode: String,
      registeredAddress: String,
      communicationAddress: String,
    },

    // PERSONAL INFO
    personalInfo: {
      fullName: String,
      dateOfBirth: Date,
      mobile: String,
      landline: String,
      officeType: String,
      roleInAgency: String,
    },

    // TEAM
    partners: [
      {
        name: String,
        role: String,
        contact: String,
        email: String,
      }
    ],
    staff: [
      {
        name: String,
        position: String,
        contact: String,
        email: String,
      }
    ],

    // DOCUMENTS
    documents: {
      agencyAddressProof: { url: String, uploadedAt: Date },
      activityLicense: { url: String, uploadedAt: Date },
      shopPhoto: { url: String, uploadedAt: Date },
      businessCard: { url: String, uploadedAt: Date },
      agencyLogo: { url: String, uploadedAt: Date },
      memberPhoto: { url: String, uploadedAt: Date },
    },

    status: {
      type: String,
      enum: [
        'submitted', 
        'pending_referral', 
        'referral_rejected', 
        'ready_for_approval', 
        'approved', 
        'rejected',
        'payment_pending',
        'completed'
      ],
      default: 'submitted',
    },
    rejectionReason: String,
    
    // PAYMENT TRACKING
    payment: {
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
      amount: Number,
      transactionId: String,
      paymentDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MembershipApplication', applicationSchema);
