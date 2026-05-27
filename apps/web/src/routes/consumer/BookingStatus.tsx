import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../../hooks/useBooking';
import { updateBookingStatus } from '@servivo/firebase';
import { StatusBadge, Button, Card } from '@servivo/ui';

const statusMessages: Record<string, string> = {
  pending:     'Waiting for the pro to accept your request…',
  accepted:    '🎉 Pro accepted! They\'re on their way to you.',
  rejected:    'The pro is unavailable. Try booking another.',
  in_progress: '🔧 Your pro has arrived and is working.',
  completed:   '✅ All done! Your service is complete.',
  cancelled:   'This booking was cancelled.',
};

export default function BookingStatus() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading } = useBooking(bookingId ?? null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading booking…
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  const handleCancel = async () => {
    await updateBookingStatus(booking.id, 'cancelled');
    navigate('/consumer');
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Status</h1>
            <StatusBadge status={booking.status} />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pro</span>
              <span className="font-medium">{booking.proName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-medium">{booking.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Distance</span>
              <span className="font-medium">{booking.distanceKm.toFixed(1)} km</span>
            </div>
            {booking.acceptedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Accepted at</span>
                <span className="font-medium">{new Date(booking.acceptedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-center text-indigo-700 font-medium">
            {statusMessages[booking.status]}
          </p>

          <div className="mt-6 space-y-2">
            {booking.status === 'pending' && (
              <Button variant="danger" size="md" className="w-full" onClick={handleCancel}>
                Cancel Request
              </Button>
            )}
            {['completed', 'rejected', 'cancelled'].includes(booking.status) && (
              <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/consumer')}>
                Find Another Pro
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
