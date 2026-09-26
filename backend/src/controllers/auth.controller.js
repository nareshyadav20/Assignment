import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { logAuditEvent } from '../services/audit.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Look up user across tenants by email
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: {
        tenant: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'AUTH',
        resourceId: user.id,
        description: `Failed login attempt for user ${user.email} (incorrect password)`,
        ipAddress: clientIp,
        metadata: { email: user.email }
      });
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your account has been deactivated. Please contact your administrator.');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your organization tenant account is suspended.');
    }

    const token = generateToken({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    await logAuditEvent({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: user.id,
      description: `User ${user.name} (${user.role}) logged in successfully.`,
      ipAddress: clientIp,
      metadata: { role: user.role, tenantSlug: user.tenant.slug }
    });

    const { passwordHash, ...sanitizedUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizedUser,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        status: user.tenant.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const { passwordHash, ...sanitizedUser } = user;

    res.status(200).json({
      success: true,
      user: sanitizedUser,
      tenant: user.tenant
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user && req.tenantId) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      await logAuditEvent({
        tenantId: req.tenantId,
        userId: req.user.id,
        action: 'USER_LOGOUT',
        resourceType: 'AUTH',
        resourceId: req.user.id,
        description: `User ${req.user.name} logged out.`,
        ipAddress: clientIp
      });
    }

    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
