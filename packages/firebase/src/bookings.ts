import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Booking, BookingRequest, BookingStatus } from '@servivo/types';
import { firebaseApp } from './config';

const db = getFirestore(firebaseApp);
const bookingsRef = collection(db, 'bookings');

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createBooking(req: BookingRequest): Promise<string> {
  const docRef = await addDoc(bookingsRef, {
    ...req,
    status: 'pending' as BookingStatus,
    createdAt: Date.now(),
  });
  return docRef.id;
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  extra?: Partial<Booking>,
): Promise<void> {
  await updateDoc(doc(bookingsRef, bookingId), {
    status,
    ...extra,
    ...(status === 'accepted' ? { acceptedAt: Date.now() } : {}),
    ...(status === 'completed' ? { completedAt: Date.now() } : {}),
  });
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

/** Listen to a single booking by ID. */
export function subscribeToBooking(
  bookingId: string,
  callback: (booking: Booking | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(bookingsRef, bookingId),
    (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null),
    (err) => { console.error('subscribeToBooking error:', err); callback(null); },
  );
}

/** Listen to all bookings for a consumer, sorted newest-first.
 *  Simple single-field query — no composite index needed.
 *  Sorted client-side to match subscribeAllProBookings. */
export function subscribeConsumerBookings(
  consumerId: string,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  const q = query(bookingsRef, where('consumerId', '==', consumerId));
  return onSnapshot(
    q,
    (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(sorted);
    },
    (err) => { console.error('subscribeConsumerBookings error:', err); callback([]); },
  );
}

// ─── Rating ───────────────────────────────────────────────────────────────────

/** Submit a consumer's star rating after a booking is completed.
 *  Updates the booking document and recalculates the pro's rolling average. */
export async function submitRating(
  bookingId: string,
  proId: string,
  rating: number,
  review?: string,
): Promise<void> {
  // 1. Save rating on the booking
  await updateDoc(doc(bookingsRef, bookingId), {
    rating,
    ...(review ? { review } : {}),
    ratedAt: Date.now(),
  });

  // 2. Update pro's rolling average rating + increment completedBookings
  const usersRef = collection(db, 'users');
  const proSnap = await getDoc(doc(usersRef, proId));
  if (proSnap.exists()) {
    const pro = proSnap.data() as any;
    const oldCount: number = pro.completedBookings ?? 0;
    const oldRating: number = pro.rating ?? 5.0;
    const newCount = oldCount + 1;
    const newRating = oldCount === 0
      ? rating
      : Math.round(((oldRating * oldCount + rating) / newCount) * 10) / 10;
    await updateDoc(doc(usersRef, proId), {
      rating: newRating,
      completedBookings: newCount,
    });
  }
}

/** Listen to ALL bookings for a pro (active + past), sorted newest first.
 *  Used by the pro booking history page. */
export function subscribeAllProBookings(
  proId: string,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  const q = query(bookingsRef, where('proId', '==', proId));
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(all);
    },
    (err) => { console.error('subscribeAllProBookings error:', err); callback([]); },
  );
}

/** Listen to all active bookings directed at a pro.
 *  Simple single-field query so no composite index needed.
 *  Filtered and sorted client-side. */
export function subscribeProBookings(
  proId: string,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  const activeStatuses = ['pending', 'accepted', 'in_progress'];
  const q = query(bookingsRef, where('proId', '==', proId));
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      const filtered = all
        .filter((b) => activeStatuses.includes(b.status))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(filtered);
    },
    (err) => { console.error('subscribeProBookings error:', err); callback([]); },
  );
}
