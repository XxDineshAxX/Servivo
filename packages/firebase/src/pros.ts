import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import type { ProProfile, GeoPoint, AvailabilitySlot } from '@servivo/types';
import { firebaseApp } from './config';

const db = getFirestore(firebaseApp);
const usersRef = collection(db, 'users');
const slotsRef = collection(db, 'availability');

// ─── Location ─────────────────────────────────────────────────────────────────

/** Update a pro's current location and online status. */
export async function updateProLocation(
  proId: string,
  location: GeoPoint,
  isOnline: boolean,
): Promise<void> {
  await updateDoc(doc(usersRef, proId), { location, isOnline });
}

/** Update pro FCM token for push notifications. */
export async function updateFcmToken(proId: string, token: string): Promise<void> {
  await updateDoc(doc(usersRef, proId), { fcmToken: token });
}

// ─── Online pros listener ─────────────────────────────────────────────────────

/** Subscribe to all pros who are currently online. */
export function subscribeOnlinePros(
  callback: (pros: ProProfile[]) => void,
): Unsubscribe {
  const q = query(usersRef, where('role', '==', 'pro'), where('isOnline', '==', true));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => d.data() as ProProfile)),
  );
}

// ─── Availability ─────────────────────────────────────────────────────────────

/** Fetch all availability slots that overlap the next 60 minutes. */
export async function fetchSoonAvailability(now: number = Date.now()): Promise<AvailabilitySlot[]> {
  const windowEnd = now + 60 * 60 * 1000;
  // Firestore requires an index on (endAt) for this query
  const q = query(slotsRef, where('endAt', '>=', now));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as AvailabilitySlot)
    .filter((s) => s.startAt <= windowEnd);
}

/** Add an availability slot for a pro. */
export async function addAvailabilitySlot(slot: AvailabilitySlot): Promise<string> {
  const { addDoc } = await import('firebase/firestore');
  const ref = await addDoc(slotsRef, slot);
  return ref.id;
}
