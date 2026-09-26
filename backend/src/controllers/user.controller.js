import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { logAuditEvent } from '../services/audit.service.js';
import { emitTenantEvent } from '../services/socket.service.js';

export const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId: req.tenantId,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { campaignAssignments: true, assignedEvents: true }
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        campaignAssignments: {
          include: {
            campaign: {
              select: { id: true, name: true, status: true }
            }
          }
        },
        assignedEvents: {
          select: { id: true, eventType: true, severity: true, status: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'USER', status = 'ACTIVE' } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const existing = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: req.tenantId,
          email: email.toLowerCase().trim()
        }
      }
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists in your organization.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenantId: req.tenantId,
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        status
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'USER_CREATED', newUser);

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'USER_CREATE',
      resourceType: 'USER',
      resourceId: newUser.id,
      description: `Created new user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`,
      ipAddress: clientIp,
      metadata: { role: newUser.role, email: newUser.email }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, password } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Security check: users cannot modify their own role
    if (id === req.user.id && role && role !== req.user.role) {
      throw new ForbiddenError('Security rule: You cannot modify your own role.');
    }

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('User not found.');
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: req.tenantId,
            email: email.toLowerCase().trim()
          }
        }
      });
      if (emailConflict) {
        throw new ConflictError('Another user with this email address already exists.');
      }
    }

    let passwordHashUpdate = {};
    if (password) {
      passwordHashUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(role && { role }),
        ...(status && { status }),
        ...passwordHashUpdate
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'USER_UPDATED', updated);

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'USER_UPDATE',
      resourceType: 'USER',
      resourceId: id,
      description: `Updated profile/status for user ${updated.name}.`,
      ipAddress: clientIp,
      metadata: { role: updated.role, status: updated.status }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    if (id === req.user.id) {
      throw new ForbiddenError('You cannot delete your own account.');
    }

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('User not found.');
    }

    await prisma.user.delete({
      where: { id }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'USER_DELETED', { id });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'USER_DELETE',
      resourceType: 'USER',
      resourceId: id,
      description: `Deleted user ${existing.name} (${existing.email}).`,
      ipAddress: clientIp
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
