import React from 'react';
import type { Booking } from '@servivo/types';
import { Card, CardHeader, StatusBadge, Button } from '@servivo/ui';
import { updateBookingStatus } from '@servivo/firebase';

interface BookingCardProps {
  booking: Booking;
  /** If true — show pro actions (accept/reject). Otherwise show consumer view. */
  proView?: boolean;
}

export function BookingCard({ booking, proView }: BookingCardProps) {
  const [acting, setActing] = React.useState(false);

  const handleAction = async (status: 'accepted' | 'rejected') => {
    setActing(true);
    try {
      await updateBookingStatus(booking.id, status);
    } finally {
      setActing(false);
    }
  };

  return (
    <Card className="mb-3">
      <CardHeader
        title={proView ? booking.consumerName : booking.proName}
        subtitle={booking.serviceType}
        right={<StatusBadge status={booking.status} />}
      />

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
        <p>📍 {booking.distanceKm.toFixed(1)} km away</p>
        <p>🕐 {new Date(booking.createdAt).toLocaleTimeString()}</p>
        {booking.note && <p className="italic text-gray-500 dark:text-gray-500">"{booking.note}"</p>}
      </div>

      {proView && booking.status === 'accepted' && (
        <div className="mt-2">
          <button
            onClick={() => {
              const { lat, lng } = booking.consumerLocation;
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              const url = isIOS
                ? `https://maps.apple.com/?daddr=${lat},${lng}`
                : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
              window.open(url, '_blank', 'noopener');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
          >
            🗺 Get Directions
          </button>
        </div>
      )}

      {proView && booking.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            loading={acting}
            onClick={() => handleAction('accepted')}
          >
            Accept
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            loading={acting}
            onClick={() => handleAction('rejected')}
          >
            Decline
          </Button>
        </div>
      )}
    </Card>
  );
}
