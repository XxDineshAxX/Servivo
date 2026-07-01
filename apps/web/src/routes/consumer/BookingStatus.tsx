import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import type { GeoPoint } from '@servivo/types';
import { useBooking } from '../../hooks/useBooking';
import { updateBookingStatus, submitRating, subscribeUserLocation } from '@servivo/firebase';
import { StatusBadge, Button, Card } from '@servivo/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

const statusMessages: Record<string, string> = {
  pending:     'Waiting for the pro to accept your request…',
  accepted:    '🎉 Pro accepted! They\'re on their way to you.',
  rejected:    'The pro is unavailable. Try booking another.',
  in_progress: '🔧 Your pro has arrived and is working.',
  completed:   '✅ All done! Your service is complete.',
  cancelled:   'This booking was cancelled.',
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 justify-center my-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none"
        >
          {star <= (hover || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

/** Live tracking map — shows consumer (blue) and pro (indigo) markers. */
function TrackingMap({
  consumerLocation,
  proId,
  proName,
}: {
  consumerLocation: GeoPoint;
  proId: string;
  proName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const proMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const consumerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [proLocation, setProLocation] = useState<GeoPoint | null>(null);

  // Subscribe to pro's live location
  useEffect(() => {
    const unsub = subscribeUserLocation(proId, (loc) => setProLocation(loc));
    return unsub;
  }, [proId]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [consumerLocation.lng, consumerLocation.lat],
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Consumer marker (blue)
    const consumerEl = document.createElement('div');
    consumerEl.style.cssText = `
      width:14px;height:14px;border-radius:50%;
      background:#3b82f6;border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    `;
    consumerEl.title = 'Your location';
    consumerMarkerRef.current = new mapboxgl.Marker({ element: consumerEl })
      .setLngLat([consumerLocation.lng, consumerLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setText('Your location'))
      .addTo(map);

    mapRef.current = map;

    return () => {
      proMarkerRef.current?.remove();
      consumerMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      proMarkerRef.current = null;
      consumerMarkerRef.current = null;
    };
  }, []);

  // Update / create pro marker when location updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !proLocation) return;

    if (!proMarkerRef.current) {
      // Create pro marker (indigo)
      const proEl = document.createElement('div');
      proEl.style.cssText = `
        width:36px;height:36px;border-radius:50%;
        background:#4f46e5;border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4);
        cursor:default;
      `;
      proEl.textContent = '🔧';
      proEl.title = proName;
      proMarkerRef.current = new mapboxgl.Marker({ element: proEl })
        .setLngLat([proLocation.lng, proLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false }).setText(proName + ' · En route'))
        .addTo(map);
    } else {
      proMarkerRef.current.setLngLat([proLocation.lng, proLocation.lat]);
    }

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([consumerLocation.lng, consumerLocation.lat]);
    bounds.extend([proLocation.lng, proLocation.lat]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
  }, [proLocation, consumerLocation]);

  return (
    <div>
      <div ref={containerRef} className="w-full h-52 rounded-xl overflow-hidden" />
      {!proLocation && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          Waiting for pro's location…
        </p>
      )}
    </div>
  );
}

export default function BookingStatus() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading } = useBooking(bookingId ?? null);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:bg-gray-900">
        Loading booking…
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Booking not found.</p>
      </div>
    );
  }

  const handleCancel = async () => {
    await updateBookingStatus(booking.id, 'cancelled');
    navigate('/consumer');
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;
    setSubmittingRating(true);
    try {
      await submitRating(booking.id, booking.proId, rating, review.trim() || undefined);
      setRatingDone(true);
    } finally {
      setSubmittingRating(false);
    }
  };

  const alreadyRated = !!booking.ratedAt || ratingDone;
  const showTracking = ['accepted', 'in_progress'].includes(booking.status);

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Booking Status</h1>
            <StatusBadge status={booking.status} />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Pro</span>
              <Link
                to={`/pro/profile/${booking.proId}`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {booking.proName}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Service</span>
              <span className="font-medium text-gray-900 dark:text-white">{booking.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Distance</span>
              <span className="font-medium text-gray-900 dark:text-white">{booking.distanceKm.toFixed(1)} km</span>
            </div>
            {booking.acceptedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Accepted at</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(booking.acceptedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-center text-indigo-700 dark:text-indigo-400 font-medium">
            {statusMessages[booking.status]}
          </p>

          {/* ── Live tracking map ─────────────────────────────────────── */}
          {showTracking && booking.consumerLocation && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Live tracking
              </p>
              <TrackingMap
                consumerLocation={booking.consumerLocation}
                proId={booking.proId}
                proName={booking.proName}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            {['accepted', 'in_progress', 'pending'].includes(booking.status) && (
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => navigate('/consumer')}
              >
                ← Back to home
              </Button>
            )}

            {['accepted', 'in_progress'].includes(booking.status) && (
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => navigate(`/consumer/chat/${booking.proId}`)}
              >
                💬 Message {booking.proName.split(' ')[0]}
              </Button>
            )}

            {booking.status === 'pending' && (
              <Button variant="danger" size="md" className="w-full" onClick={handleCancel}>
                Cancel Request
              </Button>
            )}

            {['completed', 'rejected', 'cancelled'].includes(booking.status) && (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/consumer')}
              >
                Find Another Pro
              </Button>
            )}
          </div>
        </Card>

        {/* ── Rating card (completed bookings) ────────────────────────── */}
        {booking.status === 'completed' && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            {alreadyRated ? (
              <div className="text-center py-2">
                <p className="text-2xl mb-1">🎉</p>
                <p className="font-semibold text-gray-900 dark:text-white">Thanks for your review!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You rated {booking.proName.split(' ')[0]} {booking.rating ?? rating} ⭐
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 dark:text-white text-center mb-1">
                  How was {booking.proName.split(' ')[0]}?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                  Your rating helps other consumers make better choices
                </p>

                <StarRating value={rating} onChange={setRating} />

                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Leave an optional review…"
                  rows={2}
                  className="w-full mt-2 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <Button
                  variant="primary"
                  size="md"
                  className="w-full mt-3"
                  onClick={handleSubmitRating}
                  loading={submittingRating}
                  disabled={rating === 0}
                >
                  Submit Rating
                </Button>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
