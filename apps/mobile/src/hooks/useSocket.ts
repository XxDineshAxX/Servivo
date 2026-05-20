/**
 * useSocket — connects to the backend Socket.IO server and dispatches
 * real-time booking/location updates into the Redux store.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { bookingUpdated } from '../store/slices/bookingSlice';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export function useSocket() {
  const dispatch = useDispatch();
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('booking:updated', (booking) => {
      dispatch(bookingUpdated(booking));
    });

    socket.on('booking:request', (data) => {
      // Pro-side: new booking request arrived
      // Handled in pro screens via direct socket listeners
    });

    return () => {
      socket.disconnect();
    };
  }, [token, dispatch]);

  return socketRef.current;
}
