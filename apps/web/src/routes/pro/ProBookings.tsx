import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Booking } from '@servivo/types';
import type { ProProfile } from '@servivo/types';
import { useAuthStore } from '../../store/authStore';
import { useAllProBookings } from '../../hooks/useBooking';
import { StatusBadge, Button } from '@servivo/ui';
import { updateBookingStatus, submitConsumerRating } from '@servivo/firebase';
import { HamburgerButton, SideMenu } from '../../components/SideMenu';
import { useUnreadCount } from '../../hooks/useUnreadCount';

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress'];

const statusIcon: Record<string, string> = {
  pending:     '⏳',
  accepted:    '🚗',
  in_progress: '🔧',
  completed:   '🎉',
  rejected:    '❌',
  cancelled:   '🚫',
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 my-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          {star <= (hover || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

function ProBookingRow({ booking }: { booking: Booking }) {
  const navigate = useNavigate();
  const [acting, setActing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [consumerRating, setConsumerRating] = useState(0);
  const [consumerReview, setConsumerReview] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const handleAction = async (status: 'accepted' | 'rejected') => {
    setActing(true);
    try { await updateBookingStatus(booking.id, status); }
    finally { setActing(false); }
  };

  const handleComplete = async () => {
    setActing(true);
    try { await updateBookingStatus(booking.id, 'completed'); }
    finally { setActing(false); }
  };

  const handleNavigate = () => {
    const { lat, lng } = booking.consumerLocation;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleSubmitConsumerRating = async () => {
    if (consumerRating === 0) return;
    setRatingSubmitting(true);
    try {
      await submitConsumerRating(
        booking.id,
        booking.consumerId,
        consumerRating,
        consumerReview.trim() || undefined,
      );
      setRatingDone(true);
      setShowRating(false);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const alreadyRated = !!booking.consumerRatedAt || ratingDone;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{statusIcon[booking.status] ?? '📋'}</span>
          <div className="min-w-0">
            <Link
              to={`/consumer/profile/${booking.consumerId}`}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
            >
              {booking.consumerName}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.serviceType}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>📍 {booking.distanceKm.toFixed(1)} km</span>
        <span>🕐 {new Date(booking.createdAt).toLocaleDateString()}</span>
        {booking.rating && <span>⭐ {booking.rating} stars</span>}
      </div>

      {/* Action buttons for active bookings */}
      {booking.status === 'pending' && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" loading={acting} onClick={() => handleAction('accepted')}>
            Accept
          </Button>
          <Button variant="danger" size="sm" className="flex-1" loading={acting} onClick={() => handleAction('rejected')}>
            Decline
          </Button>
        </div>
      )}

      {booking.status === 'accepted' && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" size="sm" className="flex-1" loading={acting} onClick={handleComplete}>
            Mark Complete
          </Button>
          <button
            onClick={() => navigate(`/pro/chat/${booking.consumerId}`)}
            className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
          >
            💬 Message
          </button>
          <button
            onClick={handleNavigate}
            className="px-3 py-1.5 rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
          >
            🗺 Navigate
          </button>
        </div>
      )}

      {/* Rate consumer after completion */}
      {booking.status === 'completed' && !alreadyRated && (
        <div className="mt-2">
          {!showRating ? (
            <button
              onClick={() => setShowRating(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Rate this consumer →
            </button>
          ) : (
            <div className="mt-2 border-t dark:border-gray-700 pt-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Rate {booking.consumerName.split(' ')[0]}
              </p>
              <StarRating value={consumerRating} onChange={setConsumerRating} />
              <textarea
                value={consumerReview}
                onChange={(e) => setConsumerReview(e.target.value)}
                placeholder="Optional comment…"
                rows={2}
                className="w-full mt-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-xs resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleSubmitConsumerRating}
                  loading={ratingSubmitting}
                  disabled={consumerRating === 0}
                >
                  Submit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowRating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {booking.status === 'completed' && alreadyRated && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Consumer rated · {booking.consumerRating ?? consumerRating} ⭐
        </p>
      )}
    </div>
  );
}

export default function ProBookings() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const pro = profile as ProProfile | null;
  const { bookings, loading } = useAllProBookings(pro?.uid ?? null);
  const unreadMessages = useUnreadCount(pro?.uid ?? null);
  const [menuOpen, setMenuOpen] = useState(false);

  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const past   = bookings.filter((b) => !ACTIVE_STATUSES.includes(b.status));

  const proMenuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/pro' },
    { icon: '📋', label: 'Bookings',  path: '/pro/bookings' },
    { icon: '💬', label: 'Messages',  path: '/pro/messages', badge: unreadMessages },
    { icon: '📅', label: 'Schedule',  path: '/pro/schedule' },
    { icon: '👤', label: 'Profile',   path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white">Bookings</h1>
        </div>
        <HamburgerButton onClick={() => setMenuOpen(true)} badge={unreadMessages} />
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={proMenuItems} />

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-16 text-sm">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No bookings yet</p>
            <p className="text-sm mt-1">Booking requests from consumers will appear here</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                  Active · {active.length}
                </h2>
                {active.map((b) => <ProBookingRow key={b.id} booking={b} />)}
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Past · {past.length}
                </h2>
                {past.map((b) => <ProBookingRow key={b.id} booking={b} />)}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
