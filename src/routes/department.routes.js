const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authenticate, (req, res) => res.status(200).json({ message: 'Get all departments' }));
router.get('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Get department', id: req.params.id }));
router.post('/', authenticate, (req, res) => res.status(201).json({ message: 'Department created', data: req.body }));
router.put('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Department updated', id: req.params.id }));
router.delete('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Department deleted', id: req.params.id }));

module.exports = router;
