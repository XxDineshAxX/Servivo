export type UserRole = 'CONSUMER' | 'PRO' | 'ADMIN';
export type ProAvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Pro extends User {
  bio: string | null;
  availabilityStatus: ProAvailabilityStatus;
  currentLat: number | null;
  currentLng: number | null;
  averageRating: number;
  totalReviews: number;
}
