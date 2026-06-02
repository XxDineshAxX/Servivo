import { initializeApp, getApps, getApp } from 'firebase/app';

/**
 * Reads Firebase config from environment variables.
 * Works for both Vite (VITE_) and Expo (EXPO_PUBLIC_) prefixes.
 */
function getEnv(key: string): string {
  // Vite (web)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[`VITE_${key}`] ?? '';
  }
  // Expo / React Native (process.env accessed via string index to avoid TS errors in web builds)
  const proc = (typeof globalThis !== 'undefined' && (globalThis as any).process) as any;
  if (proc?.env) {
    return proc.env[`EXPO_PUBLIC_${key}`] ?? proc.env[key] ?? '';
  }
  return '';
}

const firebaseConfig = {
  apiKey:            getEnv('FIREBASE_API_KEY'),
  authDomain:        getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnv('FIREBASE_PROJECT_ID'),
  storageBucket:     getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnv('FIREBASE_APP_ID'),
};

/** Singleton Firebase app — safe to call multiple times. */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
