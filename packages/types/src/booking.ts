import type { GeoPoint } from './user';

export type BookingStatus =
  | 'pending'    // Consumer sent request, waiting for pro
  | 'accepted'   // Pro accepted — en route
  | 'rejected'   // Pro declined
  | 'in_progress'// Pro arrived, job underway
  | 'completed'  // Job done
  | 'cancelled'; // Consumer cancelled before acceptance

export interface Booking {
  id: string;
  consumerId: string;
  consumerName: string;
  proId: string;
  proName: string;
  status: BookingStatus;
  serviceType: string;
  /** Consumer's location at time of booking */
  consumerLocation: GeoPoint;
  /** Pro's location at time of acceptance */
  proLocation?: GeoPoint;
  /** Distance in kilometres (Haversine result) */
  distanceKm: number;
  createdAt: number;   // Unix ms
  acceptedAt?: number;
  completedAt?: number;
  /** Optional consumer note */
  note?: string;
  /** Consumer's star rating (1–5) after completion */
  rating?: number;
  /** Optional consumer review text */
  review?: string;
  /** When the consumer submitted the rating */
  ratedAt?: number;
  /** Pro's rating of the consumer (1–5) after completion */
  consumerRating?: number;
  /** Pro's review text of the consumer */
  consumerReview?: string;
  /** When the pro submitted the consumer rating */
  consumerRatedAt?: number;
}

export interface BookingRequest {
  consumerId: string;
  consumerName: string;
  proId: string;
  serviceType: string;
  consumerLocation: GeoPoint;
  distanceKm: number;
  note?: string;
}
