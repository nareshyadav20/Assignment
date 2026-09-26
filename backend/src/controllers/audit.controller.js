import { getTenantAuditLogs } from '../services/audit.service.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, action, resourceType, userId } = req.query;

    const result = await getTenantAuditLogs({
      tenantId: req.tenantId, // Strict isolation
      page: Number(page),
      limit: Number(limit),
      action,
      resourceType,
      userId
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
