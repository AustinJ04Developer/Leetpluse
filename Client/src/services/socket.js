import { io } from 'socket.io-client';

let socket = null;

export const initSocketClient = () => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server:', socket.id);
    });
  }
  return socket;
};

export const getSocket = () => socket;
