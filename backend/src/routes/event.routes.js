import { Router } from 'express';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
} from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { enforceTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createEventSchema,
  updateEventStatusSchema,
  queryEventSchema
} from '../validators/event.validator.js';

const router = Router();

router.use(requireAuth, enforceTenantContext);

router.get('/stats', requirePermission('EVENT_READ'), getEventStats);

router.get(
  '/',
  requirePermission('EVENT_READ'),
  validateRequest(queryEventSchema),
  listEvents
);

router.get(
  '/:id',
  requirePermission('EVENT_READ'),
  getEventById
);

router.post(
  '/',
  requirePermission('EVENT_CREATE'),
  validateRequest(createEventSchema),
  createEvent
);

router.patch(
  '/:id',
  requirePermission('EVENT_UPDATE_STATUS'),
  validateRequest(updateEventStatusSchema),
  updateEvent
);

router.delete(
  '/:id',
  requirePermission('EVENT_DELETE'),
  deleteEvent
);

export default router;
