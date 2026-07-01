import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { firebaseApp } from './config';

const db = getFirestore(firebaseApp);
const bookingsRef = collection(db, 'bookings');
const usersRef = collection(db, 'users');

export interface ReviewEntry {
  bookingId: string;
  rating: number;
  review: string;
  reviewerName: string;
  createdAt: number;
  serviceType?: string;
}

/** Get all consumer→pro reviews for a given pro. */
export async function getProReviews(proId: string): Promise<ReviewEntry[]> {
  const snap = await getDocs(query(bookingsRef, where('proId', '==', proId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((b: any) => b.rating != null && b.review)
    .sort((a: any, b: any) => (b.ratedAt ?? 0) - (a.ratedAt ?? 0))
    .map((b: any): ReviewEntry => ({
      bookingId: b.id,
      rating: b.rating,
      review: b.review,
      reviewerName: b.consumerName,
      createdAt: b.ratedAt ?? b.createdAt,
      serviceType: b.serviceType,
    }));
}

/** Get all pro→consumer reviews for a given consumer. */
export async function getConsumerReviews(consumerId: string): Promise<ReviewEntry[]> {
  const snap = await getDocs(query(bookingsRef, where('consumerId', '==', consumerId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((b: any) => b.consumerRating != null && b.consumerReview)
    .sort((a: any, b: any) => (b.consumerRatedAt ?? 0) - (a.consumerRatedAt ?? 0))
    .map((b: any): ReviewEntry => ({
      bookingId: b.id,
      rating: b.consumerRating,
      review: b.consumerReview,
      reviewerName: b.proName,
      createdAt: b.consumerRatedAt ?? b.createdAt,
      serviceType: b.serviceType,
    }));
}

/**
 * Pro submits a rating/review for a consumer after a completed booking.
 * Updates the booking and recalculates the consumer's rolling average.
 */
export async function submitConsumerRating(
  bookingId: string,
  consumerId: string,
  rating: number,
  review?: string,
): Promise<void> {
  await updateDoc(doc(bookingsRef, bookingId), {
    consumerRating: rating,
    ...(review ? { consumerReview: review } : {}),
    consumerRatedAt: Date.now(),
  });

  // Recalculate consumer's rolling average
  const consumerSnap = await getDoc(doc(usersRef, consumerId));
  if (consumerSnap.exists()) {
    const consumer = consumerSnap.data() as any;
    const oldCount: number = consumer.ratingCount ?? 0;
    const oldRating: number = consumer.avgRating ?? 5.0;
    const newCount = oldCount + 1;
    const newRating =
      oldCount === 0
        ? rating
        : Math.round(((oldRating * oldCount + rating) / newCount) * 10) / 10;
    await updateDoc(doc(usersRef, consumerId), {
      avgRating: newRating,
      ratingCount: newCount,
    });
  }
}

/**
 * Subscribe to a user's live location (for tracking a pro en route).
 * Returns an unsubscribe function.
 */
export function subscribeUserLocation(
  userId: string,
  callback: (location: { lat: number; lng: number } | null) => void,
) {
  return onSnapshot(
    doc(usersRef, userId),
    (snap: any) => {
      if (!snap.exists()) { callback(null); return; }
      const data = snap.data();
      if (data?.location?.lat != null) {
        callback({ lat: data.location.lat, lng: data.location.lng });
      } else {
        callback(null);
      }
    },
    (err: any) => { console.error('subscribeUserLocation error:', err); callback(null); },
  );
}
