import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const enforceTenantContext = (req, res, next) => {
  if (!req.user || !req.tenantId) {
    return next(new UnauthorizedError('Tenant context could not be established. Authentication required.'));
  }

  // Prevent client from injecting or tampering with tenantId
  if (req.body && req.body.tenantId) {
    delete req.body.tenantId;
  }
  if (req.query && req.query.tenantId) {
    delete req.query.tenantId;
  }

  next();
};
