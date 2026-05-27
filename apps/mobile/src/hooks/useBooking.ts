import { useState, useEffect } from 'react';
import type { Booking, BookingRequest, BookingStatus } from '@servivo/types';
import {
  createBooking,
  updateBookingStatus,
  subscribeToBooking,
  subscribeProBookings,
  subscribeConsumerBookings,
} from '@servivo/firebase';

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (req: BookingRequest): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      return await createBooking(req);
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}

export function useBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    return subscribeToBooking(bookingId, (b) => {
      setBooking(b);
      setLoading(false);
    });
  }, [bookingId]);

  return { booking, loading };
}

export function useProBookings(proId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proId) return;
    return subscribeProBookings(proId, (b) => {
      setBookings(b);
      setLoading(false);
    });
  }, [proId]);

  const respond = (bookingId: string, status: 'accepted' | 'rejected') =>
    updateBookingStatus(bookingId, status);

  return { bookings, loading, respond };
}

export function useConsumerBookings(consumerId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consumerId) return;
    return subscribeConsumerBookings(consumerId, (b) => {
      setBookings(b);
      setLoading(false);
    });
  }, [consumerId]);

  return { bookings, loading };
}
