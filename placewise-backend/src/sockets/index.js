const { Server } = require('socket.io');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialise Socket.io on the HTTP server.
 * Called once from server.js.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── JWT Authentication Middleware ────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required. Provide JWT in handshake.auth.token'));
    }
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded; // { userId, role, email }
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  // ── Connection Handler ───────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, role } = socket.user;
    logger.info(`Socket connected: userId=${userId} role=${role} socketId=${socket.id}`);

    // Each user gets their own private room
    socket.join(userId);

    // Placement officers and admins also join a shared room
    // so dashboard:refresh events can be broadcast to all of them at once
    if (role === 'placement' || role === 'admin') {
      socket.join('placement-room');
    }

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: userId=${userId} reason=${reason}`);
    });

    // Client can request a ping to keep connection alive
    socket.on('ping', () => socket.emit('pong'));
  });

  logger.info('Socket.io initialised.');
  return io;
};

/**
 * Get the Socket.io server instance.
 * Used by services to emit events.
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised. Call initSocket first.');
  return io;
};

/**
 * Emit an event to a specific user's private room.
 */
const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(userId).emit(event, payload);
  } catch (err) {
    logger.warn(`Socket emit failed for user ${userId}:`, err.message);
  }
};

/**
 * Emit an event to all placement officers and admins.
 */
const emitToPlacement = (event, payload) => {
  try {
    getIO().to('placement-room').emit(event, payload);
  } catch (err) {
    logger.warn('Socket emit to placement room failed:', err.message);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToPlacement };