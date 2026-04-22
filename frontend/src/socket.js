import { io } from 'socket.io-client';

// Replace with your actual Backend URL
const SOCKET_URL = 'http://localhost:5000'; 

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  // This ensures the connection works across different ports
  transports: ['websocket'] 
});