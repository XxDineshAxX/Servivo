import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
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

// ─── Saved pros ───────────────────────────────────────────────────────────────

/** Add a pro to a consumer's saved list. */
export async function savePro(consumerId: string, proId: string): Promise<void> {
  await updateDoc(doc(usersRef, consumerId), { savedProIds: arrayUnion(proId) });
}

/** Remove a pro from a consumer's saved list. */
export async function unsavePro(consumerId: string, proId: string): Promise<void> {
  await updateDoc(doc(usersRef, consumerId), { savedProIds: arrayRemove(proId) });
}

/** Fetch full ProProfile documents for an array of pro IDs. */
export async function getSavedProProfiles(proIds: string[]): Promise<ProProfile[]> {
  if (proIds.length === 0) return [];
  const snaps = await Promise.all(proIds.map((id) => getDoc(doc(usersRef, id))));
  return snaps.filter((s) => s.exists()).map((s) => s.data() as ProProfile);
}
