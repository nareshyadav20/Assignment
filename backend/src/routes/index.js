import { Router } from 'express';
import authRoutes from './auth.routes.js';
import campaignRoutes from './campaign.routes.js';
import eventRoutes from './event.routes.js';
import userRoutes from './user.routes.js';
import auditRoutes from './audit.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
