const prisma = require('../lib/prisma');

const getAllPositions = async (req, res) => {
  try {
    const positions = await prisma.position.findMany();
    res.status(200).json({ success: true, data: positions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPositionById = async (req, res) => {
  try {
    const position = await prisma.position.findUnique({ where: { id: req.params.id } });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found' });
    res.status(200).json({ success: true, data: position });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPosition = async (req, res) => {
  try {
    const position = await prisma.position.create({ data: req.body });
    res.status(201).json({ success: true, data: position });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePosition = async (req, res) => {
  try {
    const position = await prisma.position.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: position });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePosition = async (req, res) => {
  try {
    await prisma.position.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Position deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllPositions, getPositionById, createPosition, updatePosition, deletePosition };
