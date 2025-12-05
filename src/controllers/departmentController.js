const prisma = require('../lib/prisma');

const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const dept = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
