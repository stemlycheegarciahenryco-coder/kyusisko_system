/**
 * socketManager.js
 * 
 * A singleton that holds the Socket.IO `io` instance and maintains a live
 * map of userId → socketId so any controller/route can emit events to a
 * specific user without needing direct access to `io`.
 * 
 * Usage in any controller:
 *   const { emitToUser, emitToRole, emitToAll } = require('../config/socketManager');
 *   emitToUser(studentId, 'new_notification', payload);
 */

let _io = null;

// Maps userId (string) → Set of socketIds
// A user can have multiple tabs open, so we track all their sockets
const userSocketMap = new Map();

/**
 * Called once from server.js after io is created.
 * Registers connection/disconnect handlers and stores the io reference.
 */
const init = (io) => {
  _io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Client must emit 'register' immediately after connecting with their userId
    // e.g. socket.emit('register', { userId: '42', role: 'student' })
    socket.on('register', ({ userId, role }) => {
      if (!userId) return;

      const key = String(userId);

      // Add to user→socket map
      if (!userSocketMap.has(key)) {
        userSocketMap.set(key, new Set());
      }
      userSocketMap.get(key).add(socket.id);

      // Join role-based rooms for broadcast events
      // e.g. 'role:student', 'role:sub_admin', 'role:root_admin'
      socket.join(`role:${role}`);
      socket.join(`user:${key}`);

      console.log(`[Socket] User ${key} (${role}) registered → socket ${socket.id}`);
    });

    // Client joins a specific chat thread room for real-time messages
    socket.on('join_thread', ({ threadId }) => {
      if (threadId) {
        socket.join(`thread:${threadId}`);
        console.log(`[Socket] Socket ${socket.id} joined thread:${threadId}`);
      }
    });

    socket.on('leave_thread', ({ threadId }) => {
      if (threadId) {
        socket.leave(`thread:${threadId}`);
      }
    });

    socket.on('disconnect', () => {
      // Remove this socket from the userSocketMap
      userSocketMap.forEach((sockets, userId) => {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
        }
      });
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit an event to a specific user by their userId.
 * Works even if the user has multiple tabs open.
 */
const emitToUser = (userId, event, payload) => {
  if (!_io) return;
  _io.to(`user:${String(userId)}`).emit(event, payload);
};

/**
 * Emit an event to all connected users with a specific role.
 * e.g. emitToRole('root_admin', 'new_audit_log', data)
 */
const emitToRole = (role, event, payload) => {
  if (!_io) return;
  _io.to(`role:${role}`).emit(event, payload);
};

/**
 * Emit an event to all users in a specific chat thread room.
 * e.g. emitToThread(42, 'new_message', messageData)
 */
const emitToThread = (threadId, event, payload) => {
  if (!_io) return;
  _io.to(`thread:${String(threadId)}`).emit(event, payload);
};

/**
 * Emit an event to every connected socket (broadcast).
 * e.g. emitToAll('new_scholarship', scholarshipData)
 */
const emitToAll = (event, payload) => {
  if (!_io) return;
  _io.emit(event, payload);
};

const getIo = () => _io;

module.exports = { init, emitToUser, emitToRole, emitToThread, emitToAll, getIo };