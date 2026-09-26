import prisma from '../config/database.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { range = '30d' } = req.query;

    let startDate = null;
    const now = new Date();

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalEvents,
      openEvents,
      criticalEvents,
      highEvents,
      resolvedEvents,
      totalUsers,
      activeUsers,
      recentEvents,
      recentAuditLogs,
      eventsBySeverity,
      campaignsByStatus,
      rawEventsForTrends
    ] = await Promise.all([
      prisma.campaign.count({ where: { tenantId } }),
      prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          ...(dateFilter && { createdAt: dateFilter })
        }
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          status: 'OPEN',
          ...(dateFilter && { createdAt: dateFilter })
        }
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          severity: 'CRITICAL',
          ...(dateFilter && { createdAt: dateFilter })
        }
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          severity: 'HIGH',
          ...(dateFilter && { createdAt: dateFilter })
        }
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          status: 'RESOLVED',
          ...(dateFilter && { createdAt: dateFilter })
        }
      }),
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.securityEvent.findMany({
        where: {
          tenantId,
          ...(dateFilter && { createdAt: dateFilter })
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.securityEvent.groupBy({
        by: ['severity'],
        where: {
          tenantId,
          ...(dateFilter && { createdAt: dateFilter })
        },
        _count: { severity: true }
      }),
      prisma.campaign.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      }),
      prisma.securityEvent.findMany({
        where: {
          tenantId,
          ...(dateFilter && { createdAt: dateFilter })
        },
        select: { createdAt: true, severity: true, status: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Build timeline trend data grouped by day
    const trendMap = {};
    rawEventsForTrends.forEach((evt) => {
      const dayKey = new Date(evt.createdAt).toISOString().split('T')[0];
      if (!trendMap[dayKey]) {
        trendMap[dayKey] = { date: dayKey, total: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      }
      trendMap[dayKey].total += 1;
      trendMap[dayKey][evt.severity] = (trendMap[dayKey][evt.severity] || 0) + 1;
    });

    const eventTrends = Object.values(trendMap);

    res.status(200).json({
      success: true,
      data: {
        range,
        summary: {
          campaigns: {
            total: totalCampaigns,
            active: activeCampaigns,
            completed: completedCampaigns
          },
          events: {
            total: totalEvents,
            open: openEvents,
            critical: criticalEvents,
            high: highEvents,
            resolved: resolvedEvents
          },
          users: {
            total: totalUsers,
            active: activeUsers
          }
        },
        recentEvents,
        recentAuditLogs,
        charts: {
          eventsBySeverity: eventsBySeverity.map((item) => ({
            name: item.severity,
            value: item._count.severity
          })),
          campaignsByStatus: campaignsByStatus.map((item) => ({
            name: item.status,
            value: item._count.status
          })),
          eventTrends
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
