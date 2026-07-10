import { io } from 'socket.io-client';

// Use the same backend URL logic as api.js
const SOCKET_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export const socket = io(SOCKET_URL, {
  autoConnect: false, // FIX: Don't connect until the user is logged in and we
                      // can register them. Call socket.connect() after login.
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Call this right after a successful login to connect the socket
 * and register the user so the server can route events to them.
 *
 * @param {string|number} userId  - The logged-in user's ID
 * @param {string}        role    - 'student' | 'sub_admin' | 'root_admin'
 */
export const connectSocket = (userId, role) => {
  if (!socket.connected) {
    socket.connect();
  }
  // Tell the server who this socket belongs to
  socket.emit('register', { userId: String(userId), role });
};

/**
 * Call this on logout to cleanly disconnect.
 */
export const disconnectSocket = () => {
  socket.disconnect();
};

/**
 * Join a specific chat thread room so real-time messages for that
 * thread are pushed to this client.
 */
export const joinThread = (threadId) => {
  socket.emit('join_thread', { threadId: String(threadId) });
};

export const leaveThread = (threadId) => {
  socket.emit('leave_thread', { threadId: String(threadId) });
};