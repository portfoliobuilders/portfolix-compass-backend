const { PrismaClient } = require('@prisma/client');
const Leave = require('../models/Leave');
const prisma = new PrismaClient();

// Request leave
exports.requestLeave = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, leaveType, reason, approverId } = req.body;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!employeeId || !startDate || !endDate || !leaveType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID, start date, end date, and leave type are required' 
      });
    }

    // Verify employee exists
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

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDifference <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date must be after start date' 
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        employeeId: employeeId,
        status: { in: ['approved', 'pending'] },
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee already has an overlapping leave request for these dates' 
      });
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        numberOfDays: daysDifference,
        leaveType,
        reason: reason || '',
        status: 'pending',
        approverId: approverId || null,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Leave',
        entityId: leave.id,
        action: 'requestLeave',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting leave',
      error: error.message
    });
  }
};

// Approve or reject leave
exports.approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, approverComments } = req.body;
    const approverId = req.user.id;
    const companyId = req.user.companyId;

    if (!leaveId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Leave ID and status are required' 
      });
    }

    // Verify valid status values
    const validStatuses = ['approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }

    // Find leave request
    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        companyId: companyId
      }
    });

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leave request not found' 
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending leave requests can be approved or rejected' 
      });
    }

    // Update leave request
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status,
        approverId,
        approverComments: approverComments || '',
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } }
      }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Leave',
        entityId: leaveId,
        action: `${status}Leave`,
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: updatedLeave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave',
      error: error.message
    });
  }
};

// Get employee leave requests
exports.getLeaveByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID is required' 
      });
    }

    // Verify employee exists
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

    // Build filters
    let whereClause = {
      employeeId: employeeId,
      companyId: companyId
    };

    if (status) whereClause.status = status;

    if (startDate || endDate) {
      whereClause.startDate = {};
      if (startDate) whereClause.startDate.gte = new Date(startDate);
      if (endDate) whereClause.startDate.lte = new Date(endDate);
    }

    const leaves = await prisma.leave.findMany({
      where: whereClause,
      include: {
        employee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalRequests: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').length,
      pending: leaves.filter(l => l.status === 'pending').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      totalApprovedDays: leaves
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + (l.numberOfDays || 0), 0)
    };

    res.status(200).json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: leaves,
      stats: stats
    });
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving leave requests',
      error: error.message
    });
  }
};

// Get pending leave requests for approval
exports.getPendingLeaves = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const companyId = req.user.companyId;

    // Build filters
    let whereClause = {
      status: 'pending',
      companyId: companyId
    };

    if (departmentId) {
      // Get all employees in department
      const employees = await prisma.employee.findMany({
        where: {
          departmentId: departmentId,
          companyId: companyId
        }
      });
      const employeeIds = employees.map(e => e.id);
      whereClause.employeeId = { in: employeeIds };
    }

    const pendingLeaves = await prisma.leave.findMany({
      where: whereClause,
      include: {
        employee: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            department: { select: { name: true } }
          } 
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({
      success: true,
      message: 'Pending leave requests retrieved successfully',
      data: pendingLeaves,
      totalCount: pendingLeaves.length
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending leave requests',
      error: error.message
    });
  }
};

// Get leave balance for employee
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.companyId;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID is required' 
      });
    }

    // Verify employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: companyId
      },
      include: {
        department: true
      }
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    // Get approved leaves
    const approvedLeaves = await prisma.leave.findMany({
      where: {
        employeeId: employeeId,
        status: 'approved',
        startDate: { 
          gte: new Date(new Date().getFullYear(), 0, 1) // Current year
        }
      }
    });

    const totalUsedDays = approvedLeaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0);
    const totalLeaveDays = 20; // Default annual leave
    const remainingDays = totalLeaveDays - totalUsedDays;

    res.status(200).json({
      success: true,
      message: 'Leave balance retrieved successfully',
      data: {
        employeeId,
        employeeName: employee.name,
        totalLeaveDays,
        usedDays: totalUsedDays,
        remainingDays: Math.max(0, remainingDays),
        department: employee.department?.name || 'N/A'
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving leave balance',
      error: error.message
    });
  }
};

module.exports = exports;
