import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing.'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid authentication token.'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, tenantId: true, status: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('User inactive or not found.'));
      }

      socket.user = user;
      socket.tenantId = user.tenantId;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const tenantRoom = `tenant:${socket.tenantId}`;
    socket.join(tenantRoom);
    console.log(`🔌 [Socket.IO] User ${socket.user.name} (${socket.user.role}) connected to ${tenantRoom}`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] User ${socket.user?.name} disconnected.`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

/**
 * Emit an event strictly to the designated tenant room.
 * Cross-tenant leakage is strictly prevented.
 */
export const emitTenantEvent = (tenantId, eventName, payload) => {
  if (io && tenantId) {
    io.to(`tenant:${tenantId}`).emit(eventName, {
      ...payload,
      _broadcastAt: new Date().toISOString()
    });
  }
};
