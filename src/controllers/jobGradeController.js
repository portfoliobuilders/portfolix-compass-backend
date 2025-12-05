const prisma = require('../lib/prisma');

const getAllJobGrades = async (req, res) => {
  try {
    const grades = await prisma.jobGrade.findMany();
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getJobGradeById = async (req, res) => {
  try {
    const grade = await prisma.jobGrade.findUnique({ where: { id: req.params.id } });
    if (!grade) return res.status(404).json({ success: false, message: 'Job grade not found' });
    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createJobGrade = async (req, res) => {
  try {
    const grade = await prisma.jobGrade.create({ data: req.body });
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateJobGrade = async (req, res) => {
  try {
    const grade = await prisma.jobGrade.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteJobGrade = async (req, res) => {
  try {
    await prisma.jobGrade.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Job grade deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllJobGrades, getJobGradeById, createJobGrade, updateJobGrade, deleteJobGrade };
