import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { enforceTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { queryAuditSchema } from '../validators/audit.validator.js';

const router = Router();

router.use(requireAuth, enforceTenantContext);

router.get(
  '/',
  requirePermission('AUDIT_LOGS_VIEW'),
  validateRequest(queryAuditSchema),
  listAuditLogs
);

export default router;
