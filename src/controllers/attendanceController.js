const { PrismaClient } = require('@prisma/client');
const Attendance = require('../models/Attendance');
const prisma = new PrismaClient();

// Mark attendance - Check-in
exports.checkIn = async (req, res) => {
  try {
    const { employeeId, checkInTime, location, notes } = req.body;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!employeeId || !checkInTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and check-in time are required' 
      });
    }

    // Check if employee exists and belongs to the company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: companyId
      }
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found or does not belong to your company' 
      });
    }

    // Check if attendance record already exists for today
    const today = new Date(checkInTime).toDateString();
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId,
        date: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee has already checked in today' 
      });
    }

    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: new Date(checkInTime),
          location,
          notes,
          updatedAt: new Date()
        }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: new Date(today),
          checkInTime: new Date(checkInTime),
          location,
          notes,
          status: 'present',
          companyId
        }
      });
    }

    // Log sync event for MongoDB
    await prisma.syncLog.create({
      data: {
        entityType: 'Attendance',
        entityId: attendance.id,
        action: 'checkIn',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording check-in',
      error: error.message
    });
  }
};

// Mark attendance - Check-out
exports.checkOut = async (req, res) => {
  try {
    const { attendanceId, checkOutTime, location, notes } = req.body;
    const companyId = req.user.companyId;

    if (!attendanceId || !checkOutTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance ID and check-out time are required' 
      });
    }

    // Find attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        companyId: companyId
      }
    });

    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    if (!attendance.checkInTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee must check-in first before checking out' 
      });
    }

    // Update with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: new Date(checkOutTime),
        workingHours: calculateWorkingHours(attendance.checkInTime, new Date(checkOutTime)),
        updatedAt: new Date()
      }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Attendance',
        entityId: updatedAttendance.id,
        action: 'checkOut',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully',
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording check-out',
      error: error.message
    });
  }
};

// Get attendance records for employee
exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID is required' 
      });
    }

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: companyId
      }
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    // Build query filters
    let whereClause = {
      employeeId: employeeId,
      companyId: companyId
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalRecords: attendanceRecords.length,
      presentDays: attendanceRecords.filter(r => r.status === 'present').length,
      absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
      totalWorkingHours: attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: attendanceRecords,
      stats: stats
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving attendance records',
      error: error.message
    });
  }
};

// Get department-wide attendance report
exports.getDepartmentAttendanceReport = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    if (!departmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department ID is required' 
      });
    }

    // Get all employees in department
    const employees = await prisma.employee.findMany({
      where: {
        departmentId: departmentId,
        companyId: companyId
      }
    });

    if (employees.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No employees found in department' 
      });
    }

    const employeeIds = employees.map(e => e.id);

    // Get attendance records
    let whereClause = {
      employeeId: { in: employeeIds },
      companyId: companyId
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Group by employee
    const reportByEmployee = employees.map(employee => {
      const records = attendanceRecords.filter(r => r.employeeId === employee.id);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalDays: records.length,
        presentDays: records.filter(r => r.status === 'present').length,
        absentDays: records.filter(r => r.status === 'absent').length,
        totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0)
      };
    });

    res.status(200).json({
      success: true,
      message: 'Department attendance report generated successfully',
      data: reportByEmployee
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report',
      error: error.message
    });
  }
};

// Helper function to calculate working hours
function calculateWorkingHours(checkInTime, checkOutTime) {
  const timeDiff = checkOutTime - checkInTime;
  return Math.round((timeDiff / (1000 * 60 * 60)) * 100) / 100; // in hours
}

module.exports = exports;
