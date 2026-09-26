import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { logAuditEvent } from '../services/audit.service.js';

export const listEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, severity, status, eventType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId: req.tenantId,
      ...(severity && { severity }),
      ...(status && { status }),
      ...(eventType && { eventType }),
      ...(search && {
        OR: [
          { eventType: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, events] = await Promise.all([
      prisma.securityEvent.count({ where }),
      prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      })
    ]);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.securityEvent.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!event) {
      throw new NotFoundError('Security event not found.');
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { eventType, severity, status = 'OPEN', description, source } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const event = await prisma.securityEvent.create({
      data: {
        tenantId: req.tenantId,
        eventType,
        severity,
        status,
        description,
        source
      }
    });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'SECURITY_EVENT_CREATE',
      resourceType: 'SECURITY_EVENT',
      resourceId: event.id,
      description: `Logged new security event: ${event.eventType} (${event.severity})`,
      ipAddress: clientIp,
      metadata: { severity: event.severity, eventType: event.eventType, source: event.source }
    });

    res.status(201).json({
      success: true,
      message: 'Security event registered successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, severity, description } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const existing = await prisma.securityEvent.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('Security event not found.');
    }

    const updated = await prisma.securityEvent.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(severity !== undefined && { severity }),
        ...(description !== undefined && { description })
      }
    });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'SECURITY_EVENT_UPDATE',
      resourceType: 'SECURITY_EVENT',
      resourceId: id,
      description: `Updated status of security event ${id} from ${existing.status} to ${updated.status}.`,
      ipAddress: clientIp,
      metadata: { oldStatus: existing.status, newStatus: updated.status, oldSeverity: existing.severity, newSeverity: updated.severity }
    });

    res.status(200).json({
      success: true,
      message: 'Security event updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const existing = await prisma.securityEvent.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('Security event not found.');
    }

    await prisma.securityEvent.delete({
      where: { id }
    });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'SECURITY_EVENT_DELETE',
      resourceType: 'SECURITY_EVENT',
      resourceId: id,
      description: `Deleted security event ${existing.eventType}.`,
      ipAddress: clientIp
    });

    res.status(200).json({
      success: true,
      message: 'Security event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getEventStats = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [bySeverity, byStatus, totalCount] = await Promise.all([
      prisma.securityEvent.groupBy({
        by: ['severity'],
        where: { tenantId },
        _count: { severity: true }
      }),
      prisma.securityEvent.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      }),
      prisma.securityEvent.count({ where: { tenantId } })
    ]);

    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    bySeverity.forEach((item) => {
      severityCounts[item.severity] = item._count.severity;
    });

    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    byStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        bySeverity: severityCounts,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};
