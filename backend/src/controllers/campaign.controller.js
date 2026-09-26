import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { logAuditEvent } from '../services/audit.service.js';
import { emitTenantEvent } from '../services/socket.service.js';

// Calculate realistic campaign progress
const computeCampaignProgress = (campaign) => {
  if (campaign.status === 'COMPLETED') return 100;
  if (campaign.status === 'DRAFT' || campaign.status === 'CANCELLED') return 0;

  if (campaign.startDate && campaign.endDate) {
    const start = new Date(campaign.startDate).getTime();
    const end = new Date(campaign.endDate).getTime();
    const now = Date.now();

    if (now <= start) return 5;
    if (now >= end) return 95;
    const elapsed = now - start;
    const totalDuration = end - start;
    const percent = Math.round((elapsed / totalDuration) * 90) + 5;
    return Math.min(Math.max(percent, 5), 95);
  }

  return 25; // Default active baseline
};

export const listCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId: req.tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          },
          _count: {
            select: { assignments: true }
          }
        }
      })
    ]);

    const campaignsWithProgress = campaigns.map((c) => ({
      ...c,
      progress: computeCampaignProgress(c)
    }));

    res.status(200).json({
      success: true,
      data: campaignsWithProgress,
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

export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        tenantId: req.tenantId // Strict tenant isolation guard
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found.');
    }

    res.status(200).json({
      success: true,
      data: {
        ...campaign,
        progress: computeCampaignProgress(campaign)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { name, description, status = 'DRAFT', startDate, endDate } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: req.tenantId,
        createdById: req.user.id,
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Real-Time Socket Broadcast strictly to tenant
    emitTenantEvent(req.tenantId, 'CAMPAIGN_CREATED', campaign);

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_CREATE',
      resourceType: 'CAMPAIGN',
      resourceId: campaign.id,
      description: `Created new security campaign '${campaign.name}'.`,
      ipAddress: clientIp,
      metadata: { name: campaign.name, status: campaign.status }
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        ...campaign,
        progress: computeCampaignProgress(campaign)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, endDate } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const existing = await prisma.campaign.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('Campaign not found.');
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'CAMPAIGN_UPDATED', updated);

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_UPDATE',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Updated campaign '${updated.name}' status to ${updated.status}.`,
      ipAddress: clientIp,
      metadata: { previousStatus: existing.status, newStatus: updated.status }
    });

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: {
        ...updated,
        progress: computeCampaignProgress(updated)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const existing = await prisma.campaign.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      throw new NotFoundError('Campaign not found.');
    }

    await prisma.campaign.delete({
      where: { id }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'CAMPAIGN_DELETED', { id });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_DELETE',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Deleted campaign '${existing.name}'.`,
      ipAddress: clientIp
    });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const assignUserToCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId: req.tenantId }
    });
    if (!campaign) {
      throw new NotFoundError('Campaign not found.');
    }

    // Verify targeted user belongs to the SAME tenant!
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, tenantId: req.tenantId }
    });
    if (!targetUser) {
      throw new NotFoundError('User not found in your organization.');
    }

    const existing = await prisma.campaignUser.findUnique({
      where: {
        campaignId_userId: {
          campaignId: id,
          userId
        }
      }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'User is already assigned to this campaign',
        data: existing
      });
    }

    const assignment = await prisma.campaignUser.create({
      data: {
        tenantId: req.tenantId,
        campaignId: id,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'CAMPAIGN_MEMBER_ASSIGNED', { campaignId: id, userId });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_MEMBER_ASSIGN',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Assigned ${targetUser.name} to campaign '${campaign.name}'.`,
      ipAddress: clientIp,
      metadata: { campaignId: id, userId, userName: targetUser.name }
    });

    res.status(201).json({
      success: true,
      message: 'User successfully assigned to campaign',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

export const removeUserFromCampaign = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId: req.tenantId }
    });
    if (!campaign) {
      throw new NotFoundError('Campaign not found.');
    }

    const assignment = await prisma.campaignUser.findUnique({
      where: {
        campaignId_userId: {
          campaignId: id,
          userId
        }
      }
    });

    if (!assignment || assignment.tenantId !== req.tenantId) {
      throw new NotFoundError('User assignment not found for this campaign.');
    }

    await prisma.campaignUser.delete({
      where: {
        campaignId_userId: {
          campaignId: id,
          userId
        }
      }
    });

    // Real-Time Socket Broadcast
    emitTenantEvent(req.tenantId, 'CAMPAIGN_MEMBER_REMOVED', { campaignId: id, userId });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_MEMBER_REMOVE',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Removed user from campaign '${campaign.name}'.`,
      ipAddress: clientIp,
      metadata: { campaignId: id, userId }
    });

    res.status(200).json({
      success: true,
      message: 'User removed from campaign'
    });
  } catch (error) {
    next(error);
  }
};
