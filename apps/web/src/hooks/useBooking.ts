import { useState, useEffect } from 'react';
import type { Booking, BookingRequest, BookingStatus } from '@servivo/types';
import {
  createBooking,
  updateBookingStatus,
  subscribeToBooking,
  subscribeProBookings,
  subscribeAllProBookings,
  subscribeConsumerBookings,
} from '@servivo/firebase';

// ─── Consumer: create a booking ───────────────────────────────────────────────

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (req: BookingRequest): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const id = await createBooking(req);
      return id;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}

// ─── Watch a single booking ───────────────────────────────────────────────────

export function useBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    const unsub = subscribeToBooking(bookingId, (b) => {
      setBooking(b);
      setLoading(false);
    });
    return unsub;
  }, [bookingId]);

  return { booking, loading };
}

// ─── Pro: watch incoming bookings ─────────────────────────────────────────────

export function useProBookings(proId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proId) return;
    const unsub = subscribeProBookings(proId, (b) => {
      setBookings(b);
      setLoading(false);
    });
    return unsub;
  }, [proId]);

  const respond = async (bookingId: string, status: 'accepted' | 'rejected') => {
    await updateBookingStatus(bookingId, status);
  };

  return { bookings, loading, respond };
}

// ─── Pro: full booking history (active + past) ───────────────────────────────

export function useAllProBookings(proId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proId) return;
    const unsub = subscribeAllProBookings(proId, (b) => {
      setBookings(b);
      setLoading(false);
    });
    return unsub;
  }, [proId]);

  return { bookings, loading };
}

// ─── Consumer: watch their booking history ────────────────────────────────────

export function useConsumerBookings(consumerId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consumerId) return;
    const unsub = subscribeConsumerBookings(consumerId, (b) => {
      setBookings(b);
      setLoading(false);
    });
    return unsub;
  }, [consumerId]);

  return { bookings, loading };
}
