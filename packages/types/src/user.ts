export type UserRole = 'consumer' | 'pro';

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  address?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number; // Unix ms
  fcmToken?: string; // For push notifications
}

export interface ConsumerProfile extends BaseUser {
  role: 'consumer';
  /** IDs of pros the consumer has saved/favourited */
  savedProIds?: string[];
}

export interface ProProfile extends BaseUser {
  role: 'pro';
  /** Service categories the pro offers (e.g. "plumber", "electrician") */
  serviceTypes: string[];
  /** Current lat/lng — updated on app open and periodically */
  location: GeoPoint;
  /** Whether the pro is currently accepting new requests */
  isOnline: boolean;
  /** Average star rating */
  rating: number;
  /** Total completed bookings */
  completedBookings: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
