const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authenticate, (req, res) => res.status(200).json({ message: 'Get all leaves' }));
router.get('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Get leave', id: req.params.id }));
router.post('/', authenticate, (req, res) => res.status(201).json({ message: 'Leave created', data: req.body }));
router.put('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Leave updated', id: req.params.id }));
router.delete('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Leave deleted', id: req.params.id }));

module.exports = router;
