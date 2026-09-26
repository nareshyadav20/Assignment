import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { enforceTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(requireAuth, enforceTenantContext);

router.get('/overview', requirePermission('DASHBOARD_VIEW'), getDashboardOverview);

export default router;
