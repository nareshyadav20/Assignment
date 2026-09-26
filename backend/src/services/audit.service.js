import prisma from '../config/database.js';

export const logAuditEvent = async ({
  tenantId,
  userId = null,
  action,
  resourceType,
  resourceId = null,
  description,
  metadata = null,
  ipAddress = null,
  tx = null
}) => {
  const client = tx || prisma;

  // Never store sensitive authentication credentials, passwords, or tokens in audit logs
  let sanitizedMetadata = null;
  if (metadata) {
    const copy = { ...metadata };
    delete copy.password;
    delete copy.passwordHash;
    delete copy.token;
    delete copy.jwt;
    delete copy.secret;
    sanitizedMetadata = copy;
  }

  try {
    return await client.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resourceType,
        resourceId,
        description,
        metadata: sanitizedMetadata,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    // Audit log failure shouldn't crash non-critical flows if outside transaction
    if (tx) throw error;
  }
};

export const getTenantAuditLogs = async ({
  tenantId,
  page = 1,
  limit = 10,
  action,
  resourceType,
  userId
}) => {
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(action && { action }),
    ...(resourceType && { resourceType }),
    ...(userId && { userId }),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
