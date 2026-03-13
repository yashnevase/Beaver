const { Server } = require('socket.io');
const { tokenService } = require('../lib/auth');
const logger = require('./logger');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const payload = tokenService.verifyAccessToken(token);
    if (!payload) {
      return next(new Error('Invalid or expired token'));
    }
    socket.userId = payload.user_id;
    socket.userRole = payload.role;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: user ${socket.userId}`);

    socket.on('join:agreement', (agreementId) => {
      const room = `agreement:${agreementId}`;
      socket.join(room);
      logger.info(`User ${socket.userId} joined room ${room}`);
    });

    socket.on('leave:agreement', (agreementId) => {
      const room = `agreement:${agreementId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${socket.userId}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if (socket.userId === userId) {
      socket.emit(event, data);
    }
  }
};

const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToRoom };
