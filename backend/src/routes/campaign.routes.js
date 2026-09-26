import { Router } from 'express';
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  assignUserToCampaign,
  removeUserFromCampaign
} from '../controllers/campaign.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { enforceTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  assignUserSchema,
  removeUserSchema,
  queryCampaignSchema
} from '../validators/campaign.validator.js';

const router = Router();

// Enforce authentication & tenant context for all campaign routes
router.use(requireAuth, enforceTenantContext);

router.get(
  '/',
  requirePermission('CAMPAIGN_READ'),
  validateRequest(queryCampaignSchema),
  listCampaigns
);

router.get(
  '/:id',
  requirePermission('CAMPAIGN_READ'),
  getCampaignById
);

router.post(
  '/',
  requirePermission('CAMPAIGN_CREATE'),
  validateRequest(createCampaignSchema),
  createCampaign
);

router.put(
  '/:id',
  requirePermission('CAMPAIGN_UPDATE'),
  validateRequest(updateCampaignSchema),
  updateCampaign
);

router.delete(
  '/:id',
  requirePermission('CAMPAIGN_DELETE'),
  deleteCampaign
);

router.post(
  '/:id/assign',
  requirePermission('CAMPAIGN_ASSIGN_USER'),
  validateRequest(assignUserSchema),
  assignUserToCampaign
);

router.delete(
  '/:id/assign/:userId',
  requirePermission('CAMPAIGN_ASSIGN_USER'),
  validateRequest(removeUserSchema),
  removeUserFromCampaign
);

export default router;
