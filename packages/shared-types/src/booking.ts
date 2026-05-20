export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Booking {
  id: string;
  consumerId: string;
  proId: string | null;
  serviceTypeId: string;
  status: BookingStatus;
  addressText: string;
  addressLat: number;
  addressLng: number;
  requestedAt: string;
  scheduledFor: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  consumerNotes: string | null;
}

export interface CreateBookingInput {
  serviceTypeId: string;
  addressText: string;
  addressLat: number;
  addressLng: number;
  consumerNotes?: string;
}
