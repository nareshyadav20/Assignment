import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required to access this resource.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

export const PERMISSIONS = {
  // Campaigns
  CAMPAIGN_CREATE: ['ADMIN', 'MANAGER'],
  CAMPAIGN_READ: ['ADMIN', 'MANAGER', 'USER'],
  CAMPAIGN_UPDATE: ['ADMIN', 'MANAGER'],
  CAMPAIGN_DELETE: ['ADMIN'],
  CAMPAIGN_ASSIGN_USER: ['ADMIN', 'MANAGER'],

  // Security Events
  EVENT_CREATE: ['ADMIN', 'MANAGER', 'USER'],
  EVENT_READ: ['ADMIN', 'MANAGER', 'USER'],
  EVENT_UPDATE_STATUS: ['ADMIN', 'MANAGER'],
  EVENT_DELETE: ['ADMIN'],

  // User Management
  USER_MANAGE: ['ADMIN'],
  USER_VIEW: ['ADMIN', 'MANAGER'],

  // Audit Logs
  AUDIT_LOGS_VIEW: ['ADMIN'],

  // Dashboard
  DASHBOARD_VIEW: ['ADMIN', 'MANAGER', 'USER'],
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required to access this resource.'));
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles || !allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Insufficient permissions for action '${permission}'. Required roles: [${allowedRoles?.join(', ')}]`
        )
      );
    }

    next();
  };
};
