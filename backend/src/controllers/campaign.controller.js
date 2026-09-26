import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { logAuditEvent } from '../services/audit.service.js';

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
        take: limit,
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

    res.status(200).json({
      success: true,
      data: campaigns,
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

export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        tenantId: req.tenantId // Tenant isolation guard
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
      data: campaign
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
      data: campaign
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

    // Verify campaign belongs to tenant
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
      }
    });

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_UPDATE',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Updated campaign '${updated.name}'.`,
      ipAddress: clientIp,
      metadata: { previousStatus: existing.status, newStatus: updated.status }
    });

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: updated
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

    // Check campaign belongs to tenant
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

    // Check existing assignment
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

    // Check campaign belongs to tenant
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

    await logAuditEvent({
      tenantId: req.tenantId,
      userId: req.user.id,
      action: 'CAMPAIGN_MEMBER_REMOVE',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      description: `Removed user ${userId} from campaign '${campaign.name}'.`,
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
