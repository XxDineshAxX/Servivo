export type UserRole = 'consumer' | 'pro';

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  address?: string;
  /** County / general area displayed on profile (not exact address) */
  county?: string;
  /** Short bio or tagline */
  bio?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  fcmToken?: string;
}

export interface ConsumerProfile extends BaseUser {
  role: 'consumer';
  savedProIds?: string[];
  /** Average rating received from pros */
  avgRating?: number;
  /** Total ratings received from pros */
  ratingCount?: number;
}

export interface ProProfile extends BaseUser {
  role: 'pro';
  serviceTypes: string[];
  location: GeoPoint;
  isOnline: boolean;
  /** Average star rating from consumers */
  rating: number;
  completedBookings: number;
  /** Starting / typical hourly rate in USD */
  hourlyRate?: number;
  /** Free-text note about pricing (e.g. "Varies by job type") */
  rateNote?: string;
  /** Whether the pro covers the full metroplex vs a single county */
  servesFullMetroplex?: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
