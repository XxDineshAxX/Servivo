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
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { ConsumerProfile, ProProfile } from '@servivo/types';
import { firebaseApp } from './config';

export interface ProfileUpdateFields {
  displayName?: string;
  username?: string;
  bio?: string;
  county?: string;
  address?: string;
  serviceTypes?: string[];
  hourlyRate?: number;
  rateNote?: string;
  servesFullMetroplex?: boolean;
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// ─── Sign up ─────────────────────────────────────────────────────────────────

export async function signUpConsumer(
  email: string,
  password: string,
  displayName: string,
  opts?: { username?: string; address?: string; county?: string; bio?: string },
): Promise<ConsumerProfile> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: ConsumerProfile = {
    uid: user.uid,
    email,
    displayName,
    ...(opts?.username ? { username: opts.username } : {}),
    ...(opts?.address  ? { address:  opts.address  } : {}),
    ...(opts?.county   ? { county:   opts.county   } : {}),
    ...(opts?.bio      ? { bio:      opts.bio      } : {}),
    role: 'consumer',
    savedProIds: [],
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
  opts?: {
    username?: string;
    address?: string;
    county?: string;
    bio?: string;
    hourlyRate?: number;
    rateNote?: string;
    servesFullMetroplex?: boolean;
  },
): Promise<ProProfile> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: ProProfile = {
    uid: user.uid,
    email,
    displayName,
    ...(opts?.username            ? { username:            opts.username            } : {}),
    ...(opts?.address             ? { address:             opts.address             } : {}),
    ...(opts?.county              ? { county:              opts.county              } : {}),
    ...(opts?.bio                 ? { bio:                 opts.bio                 } : {}),
    ...(opts?.hourlyRate != null  ? { hourlyRate:          opts.hourlyRate          } : {}),
    ...(opts?.rateNote            ? { rateNote:            opts.rateNote            } : {}),
    ...(opts?.servesFullMetroplex ? { servesFullMetroplex: opts.servesFullMetroplex } : {}),
    role: 'pro',
    serviceTypes,
    location: { lat: 0, lng: 0 },
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

  // If the Firestore profile was never created (e.g. rules blocked the write
  // during signup), create a default consumer profile now so login still works.
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) {
    const profile: ConsumerProfile = {
      uid: user.uid,
      email: user.email ?? email,
      displayName: user.displayName ?? email.split('@')[0],
      role: 'consumer',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  }

  return snap.data() as ConsumerProfile | ProProfile;
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

/**
 * Patch a user's profile fields in Firestore.
 * Only the supplied keys are written — other fields are untouched.
 */
export async function updateUserProfile(uid: string, fields: ProfileUpdateFields): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) clean[k] = v;
  }
  await updateDoc(doc(db, 'users', uid), clean);
}

// ─── Real-time auth listener ────────────────────────────────────────────────

export function onAuthProfileChange(
  callback: (profile: ConsumerProfile | ProProfile | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      callback(snap.exists() ? (snap.data() as ConsumerProfile | ProProfile) : null);
    } catch {
      callback(null);
    }
  });
}
