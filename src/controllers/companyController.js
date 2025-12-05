const prisma = require('../lib/prisma');

const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCompany = async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany };
