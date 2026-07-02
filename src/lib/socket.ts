// Lazy singleton Socket.IO connection to the Agent Arena backend.
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

/** Get (and lazily create) the shared Socket.IO client. */
export function getSocket(): Socket {
  if (!socket) {
    const options = {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    };
    // Empty API_URL = same-origin deployment behind a reverse proxy
    socket = API_URL ? io(API_URL, options) : io(options);
  }
  return socket;
}

/** Disconnect and drop the shared socket (mainly for tests/teardown). */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
