const { PrismaClient } = require('@prisma/client');
const Task = require('../models/Task');
const prisma = new PrismaClient();

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assigneeId, assignerId, dueDate, priority, status } = req.body;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!title || !assigneeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task title and assignee are required' 
      });
    }

    // Verify assignee exists and belongs to the company
    const assignee = await prisma.employee.findFirst({
      where: {
        id: assigneeId,
        companyId: companyId
      }
    });

    if (!assignee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignee not found or does not belong to your company' 
      });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assigneeId,
        assignerId: assignerId || req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        status: status || 'pending',
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        action: 'create',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// Get all tasks for an employee
exports.getTasksByAssignee = async (req, res) => {
  try {
    const { assigneeId } = req.params;
    const { status, priority } = req.query;
    const companyId = req.user.companyId;

    if (!assigneeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignee ID is required' 
      });
    }

    // Verify assignee exists
    const assignee = await prisma.employee.findFirst({
      where: {
        id: assigneeId,
        companyId: companyId
      }
    });

    if (!assignee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignee not found' 
      });
    }

    // Build filters
    let whereClause = {
      assigneeId: assigneeId,
      companyId: companyId
    };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        assigner: { select: { id: true, name: true, email: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Calculate statistics
    const stats = {
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
      stats: stats
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tasks',
      error: error.message
    });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;
    const companyId = req.user.companyId;

    if (!taskId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task ID and status are required' 
      });
    }

    // Verify valid status values
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }

    // Find and update task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        notes: notes || task.notes,
        completedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        assigner: { select: { id: true, name: true, email: true } }
      }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'updateStatus',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message
    });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user.companyId;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task ID is required' 
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId: companyId
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, position: true } },
        assigner: { select: { id: true, name: true, email: true } }
      }
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving task',
      error: error.message
    });
  }
};

// Get team tasks (by assigner/manager)
exports.getTeamTasks = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { status } = req.query;
    const companyId = req.user.companyId;

    if (!managerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager ID is required' 
      });
    }

    // Verify manager exists
    const manager = await prisma.employee.findFirst({
      where: {
        id: managerId,
        companyId: companyId
      }
    });

    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }

    // Build filters
    let whereClause = {
      assignerId: managerId,
      companyId: companyId
    };

    if (status) whereClause.status = status;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        assigner: { select: { id: true, name: true, email: true } }
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }]
    });

    res.status(200).json({
      success: true,
      message: 'Team tasks retrieved successfully',
      data: tasks,
      totalCount: tasks.length
    });
  } catch (error) {
    console.error('Get team tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving team tasks',
      error: error.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user.companyId;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task ID is required' 
      });
    }

    // Verify task exists
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId }
    });

    // Log sync event
    await prisma.syncLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'delete',
        status: 'completed',
        sourceSystem: 'PostgreSQL',
        targetSystem: 'MongoDB',
        syncedAt: new Date(),
        companyId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

module.exports = exports;
