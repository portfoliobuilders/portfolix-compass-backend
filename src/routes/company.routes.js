const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { body } = require('express-validator');

const router = express.Router();

// Get all companies
router.get('/', authenticate, (req, res) => {
  res.status(200).json({ message: 'Get all companies' });
});

// Get company by ID
router.get('/:id', authenticate, (req, res) => {
  res.status(200).json({ message: 'Get company by ID', companyId: req.params.id });
});

// Create company
router.post(
  '/',
  authenticate,
  validate([
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  ]),
  (req, res) => {
    res.status(201).json({ message: 'Company created', data: req.body });
  }
);

// Update company
router.put('/:id', authenticate, (req, res) => {
  res.status(200).json({ message: 'Company updated', companyId: req.params.id });
});

// Delete company
router.delete('/:id', authenticate, (req, res) => {
  res.status(200).json({ message: 'Company deleted', companyId: req.params.id });
});

module.exports = router;
