import prisma from '../config/database.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalEvents,
      openEvents,
      criticalEvents,
      highEvents,
      totalUsers,
      activeUsers,
      recentEvents,
      recentAuditLogs,
      eventsBySeverity,
      campaignsByStatus
    ] = await Promise.all([
      prisma.campaign.count({ where: { tenantId } }),
      prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.securityEvent.count({ where: { tenantId } }),
      prisma.securityEvent.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.securityEvent.count({ where: { tenantId, severity: 'CRITICAL' } }),
      prisma.securityEvent.count({ where: { tenantId, severity: 'HIGH' } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.securityEvent.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.securityEvent.groupBy({
        by: ['severity'],
        where: { tenantId },
        _count: { severity: true }
      }),
      prisma.campaign.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
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
            high: highEvents
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
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
