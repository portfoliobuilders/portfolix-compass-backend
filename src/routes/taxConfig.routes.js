const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { body } = require('express-validator');

// TODO: Import controller when created
// const taxConfigController = require('../controllers/taxConfigController');

const router = express.Router();

/**
 * Tax Configuration Routes
 * Managing tax configurations, slabs, and calculations
 */

// Get all tax configurations
router.get('/', authenticate, (req, res) => {
  res.status(200).json({ message: 'Get all tax configs', companyId: req.user.companyId });
});

// Get tax configuration by ID
router.get('/:id', authenticate, (req, res) => {
  res.status(200).json({ message: 'Get tax config by ID', configId: req.params.id });
});

// Create tax configuration
router.post(
  '/',
  authenticate,
  validate([
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
    body('state').notEmpty().withMessage('State is required'),
    body('incomeTaxSlabs').isArray().withMessage('Income tax slabs must be an array'),
  ]),
  (req, res) => {
    res.status(201).json({ message: 'Tax config created', data: req.body });
  }
);

// Update tax configuration
router.put(
  '/:id',
  authenticate,
  validate([
    body('year').optional().isInt(),
    body('incomeTaxSlabs').optional().isArray(),
  ]),
  (req, res) => {
    res.status(200).json({ message: 'Tax config updated', configId: req.params.id });
  }
);

// Delete tax configuration
router.delete('/:id', authenticate, (req, res) => {
  res.status(200).json({ message: 'Tax config deleted', configId: req.params.id });
});

module.exports = router;
