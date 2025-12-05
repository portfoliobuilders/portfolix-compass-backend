const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authenticate, (req, res) => res.status(200).json({ message: 'Get all attendance records' }));
router.get('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Get attendance', id: req.params.id }));
router.post('/', authenticate, (req, res) => res.status(201).json({ message: 'Attendance created', data: req.body }));
router.put('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Attendance updated', id: req.params.id }));
router.delete('/:id', authenticate, (req, res) => res.status(200).json({ message: 'Attendance deleted', id: req.params.id }));

module.exports = router;
