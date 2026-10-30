const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createPublicEnquiry,
  listPublicEnquiries,
  claimEnquiry,
  listMyEnquiries,
} = require('../controllers/enquiryController');

const router = express.Router();

const createValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .bail()
    .isLength({ max: 150 })
    .withMessage('Email must be at most 150 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be at most 20 characters')
    .bail()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Phone must be a valid phone number'),
  body('course_interest')
    .trim()
    .notEmpty()
    .withMessage('Course interest is required')
    .bail()
    .isLength({ max: 150 })
    .withMessage('Course interest must be at most 150 characters'),
  body('message')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Message must be a string')
    .bail()
    .isLength({ max: 5000 })
    .withMessage('Message must be at most 5000 characters'),
];

const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a whole number of at least 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a whole number from 1 to 100')
    .toInt(),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
}

const claimValidation = [
  param('id')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('Enquiry id must be a whole number of at least 1')
    .toInt(),
];

router.post('/public', createValidation, handleValidation, createPublicEnquiry);
router.get('/public', authenticate, listValidation, handleValidation, listPublicEnquiries);
router.get('/my', authenticate, listValidation, handleValidation, listMyEnquiries);
router.post('/:id/claim', authenticate, claimValidation, handleValidation, claimEnquiry);

module.exports = router;
