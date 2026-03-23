const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Request Profile Update Validation Rules
exports.requestUpdateValidationRules = [
  body('requestedChanges')
    .notEmpty().withMessage('Requested changes are required')
    .isObject().withMessage('Requested changes must be an object'),

  body('requestedChanges.member')
    .optional()
    .isObject().withMessage('Member details must be an object'),

  body('requestedChanges.member.roleInAgency')
    .optional()
    .isIn(['Owner', 'Partner', 'Director', 'Manager', 'Authorized Representative', 'Other']).withMessage('Invalid role in agency'),

  body('requestedChanges.member.officeType')
    .optional()
    .isIn(['Head Office', 'Branch Office', 'Regional Office', 'Other']).withMessage('Invalid office type'),

  body('requestedChanges.member.mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Mobile number must be a valid 10-digit Indian number'),

  body('requestedChanges.member.landline')
    .optional()
    .isString().withMessage('Landline must be a string'),

  body('requestedChanges.location')
    .optional()
    .isObject().withMessage('Location details must be an object'),

  body('requestedChanges.location.communicationAddress')
    .optional()
    .isString().withMessage('Communication address must be a string')
    .isLength({ min: 10, max: 200 }).withMessage('Communication address must be between 10 and 200 characters'),

  body('requestedChanges.location.pinCode')
    .optional()
    .matches(/^[6][0-9]{5}$/).withMessage('Pin code must be a valid 6-digit code starting with 6'),

  body('requestedChanges.establishment')
    .optional()
    .isObject().withMessage('Establishment details must be an object'),

  body('requestedChanges.establishment.website')
    .optional()
    .isString().withMessage('Website must be a string'),

  body('requestedChanges.establishment.officialClassification')
    .optional()
    .isIn(['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other']).withMessage('Invalid official classification'),

  body('requestedChanges.establishment.businessTypeDescription')
    .optional()
    .isString().withMessage('Business type description must be a string')
    .custom((value, { req }) => {
      if (req.body.requestedChanges?.establishment?.businessType === 'Other' && (!value || value.trim() === '')) {
        throw new Error('Business type description is required when business type is Other');
      }
      return true;
    }),

  body('requestedChanges.establishment.organizationalStatus')
    .optional()
    .isIn(['Active', 'Inactive', 'Under Process', 'Closed']).withMessage('Invalid organizational status'),

  body('requestedChanges.partner')
    .optional()
    .isObject().withMessage('Partner details must be an object'),

  body('requestedChanges.partner.name')
    .optional()
    .isString().withMessage('Partner name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Partner name must be between 2 and 100 characters'),

  body('requestedChanges.partner.mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Partner mobile must be a valid 10-digit Indian number'),

  body('requestedChanges.staff')
    .optional()
    .isObject().withMessage('Staff details must be an object'),

  body('requestedChanges.staff.name')
    .optional()
    .isString().withMessage('Staff name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Staff name must be between 2 and 100 characters'),

  body('requestedChanges.staff.mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Staff mobile must be a valid 10-digit Indian number'),

  body('requestedChanges.remarks')
    .optional()
    .isString().withMessage('Remarks must be a string')
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
];

// Validate middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => err.msg);
    const error = new ApiError(400, 'Validation failed');
    error.errors = extractedErrors;
    throw error;
  }
  next();
};
