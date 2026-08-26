import { io } from 'socket.io-client';

let socket = null;

const getSocketURL = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    if (envUrl && envUrl.includes('localhost')) {
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }
    return 'http://localhost:5000';
  }

  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }

  return 'https://leetpulse.onrender.com';
};


export const initSocketClient = () => {
  if (!socket) {
    socket = io(getSocketURL(), {
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

