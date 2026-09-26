import { Router } from 'express';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { enforceTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  queryUserSchema
} from '../validators/user.validator.js';

const router = Router();

router.use(requireAuth, enforceTenantContext);

router.get(
  '/',
  requirePermission('USER_VIEW'),
  validateRequest(queryUserSchema),
  listUsers
);

router.get(
  '/:id',
  requirePermission('USER_VIEW'),
  getUserById
);

router.post(
  '/',
  requirePermission('USER_MANAGE'),
  validateRequest(createUserSchema),
  createUser
);

router.patch(
  '/:id',
  requirePermission('USER_MANAGE'),
  validateRequest(updateUserSchema),
  updateUser
);

router.delete(
  '/:id',
  requirePermission('USER_MANAGE'),
  deleteUser
);

export default router;
