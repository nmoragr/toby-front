import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  const token = localStorage.getItem('token');
  if (socket?.connected) return socket;

  socket = io(BASE_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
