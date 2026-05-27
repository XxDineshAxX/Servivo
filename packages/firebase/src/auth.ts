import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { ConsumerProfile, ProProfile, UserRole } from '@servivo/types';
import { firebaseApp } from './config';

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// ─── Sign up ─────────────────────────────────────────────────────────────────

export async function signUpConsumer(
  email: string,
  password: string,
  displayName: string,
): Promise<ConsumerProfile> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: ConsumerProfile = {
    uid: user.uid,
    email,
    displayName,
    role: 'consumer',
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

export async function signUpPro(
  email: string,
  password: string,
  displayName: string,
  serviceTypes: string[],
): Promise<ProProfile> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: ProProfile = {
    uid: user.uid,
    email,
    displayName,
    role: 'pro',
    serviceTypes,
    location: { lat: 0, lng: 0 }, // Updated on first app open
    isOnline: false,
    rating: 5.0,
    completedBookings: 0,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

// ─── Sign in ─────────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string,
): Promise<ConsumerProfile | ProProfile> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(user.uid);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getUserProfile(
  uid: string,
): Promise<ConsumerProfile | ProProfile> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error(`No profile found for uid ${uid}`);
  return snap.data() as ConsumerProfile | ProProfile;
}

/** Subscribe to auth state changes and resolve the Firestore profile. */
export function onAuthProfileChange(
  callback: (profile: ConsumerProfile | ProProfile | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const profile = await getUserProfile(user.uid);
      callback(profile);
    } catch {
      callback(null);
    }
  });
}
