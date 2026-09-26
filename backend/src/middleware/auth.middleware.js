import { UnauthorizedError } from '../utils/errors.js';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Or check HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token is missing. Please log in.');
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new UnauthorizedError('Invalid or expired authentication token. Please log in again.');
    }

    // Verify user against database to ensure user is active and exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        tenant: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is currently inactive. Contact your tenant administrator.');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedError('Tenant organization is currently suspended.');
    }

    // Sanitize user object (omit password hash)
    const { passwordHash, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    // Derive tenant ID strictly from authenticated user's DB record
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    next(error);
  }
};
