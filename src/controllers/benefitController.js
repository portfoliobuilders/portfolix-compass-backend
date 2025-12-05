const prisma = require('../lib/prisma');

const getAllBenefits = async (req, res) => {
  try {
    const benefits = await prisma.benefit.findMany();
    res.status(200).json({ success: true, data: benefits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBenefitById = async (req, res) => {
  try {
    const benefit = await prisma.benefit.findUnique({ where: { id: req.params.id } });
    if (!benefit) return res.status(404).json({ success: false, message: 'Benefit not found' });
    res.status(200).json({ success: true, data: benefit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBenefit = async (req, res) => {
  try {
    const benefit = await prisma.benefit.create({ data: req.body });
    res.status(201).json({ success: true, data: benefit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBenefit = async (req, res) => {
  try {
    const benefit = await prisma.benefit.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: benefit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBenefit = async (req, res) => {
  try {
    await prisma.benefit.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Benefit deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllBenefits, getBenefitById, createBenefit, updateBenefit, deleteBenefit };
