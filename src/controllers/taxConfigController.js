const prisma = require('../lib/prisma');

const getAllTaxConfigs = async (req, res) => {
  try {
    const configs = await prisma.taxConfig.findMany();
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaxConfigById = async (req, res) => {
  try {
    const config = await prisma.taxConfig.findUnique({ where: { id: req.params.id } });
    if (!config) return res.status(404).json({ success: false, message: 'Tax config not found' });
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTaxConfig = async (req, res) => {
  try {
    const config = await prisma.taxConfig.create({ data: req.body });
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTaxConfig = async (req, res) => {
  try {
    const config = await prisma.taxConfig.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTaxConfig = async (req, res) => {
  try {
    await prisma.taxConfig.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Tax config deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTaxConfigs, getTaxConfigById, createTaxConfig, updateTaxConfig, deleteTaxConfig };
