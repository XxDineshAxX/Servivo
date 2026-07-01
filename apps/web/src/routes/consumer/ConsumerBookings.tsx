import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@servivo/types';
import type { ConsumerProfile } from '@servivo/types';
import { useAuthStore } from '../../store/authStore';
import { useConsumerBookings } from '../../hooks/useBooking';
import { StatusBadge } from '@servivo/ui';
import { HamburgerButton, SideMenu } from '../../components/SideMenu';
import { useUnreadCount } from '../../hooks/useUnreadCount';

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress'];

const statusIcon: Record<string, string> = {
  pending:     '⏳',
  accepted:    '✅',
  in_progress: '🔧',
  completed:   '🎉',
  rejected:    '❌',
  cancelled:   '🚫',
};

function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 text-left shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{statusIcon[booking.status] ?? '📋'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{booking.proName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.serviceType}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>📍 {booking.distanceKm.toFixed(1)} km</span>
        <span>🕐 {new Date(booking.createdAt).toLocaleDateString()}</span>
        {booking.rating && <span>⭐ You rated {booking.rating}</span>}
      </div>
    </button>
  );
}

export default function ConsumerBookings() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const consumer = profile as ConsumerProfile | null;
  const { bookings, loading } = useConsumerBookings(consumer?.uid ?? null);
  const unreadMessages = useUnreadCount(consumer?.uid ?? null);
  const [menuOpen, setMenuOpen] = useState(false);

  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const past   = bookings.filter((b) => !ACTIVE_STATUSES.includes(b.status));

  const consumerMenuItems = [
    { icon: '🏠', label: 'Home',     path: '/consumer' },
    { icon: '📋', label: 'Bookings', path: '/consumer/bookings' },
    { icon: '💬', label: 'Messages', path: '/consumer/chats', badge: unreadMessages },
    { icon: '👤', label: 'Profile',  path: '/profile' },
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
          <h1 className="font-bold text-gray-900 dark:text-white">My Bookings</h1>
        </div>
        <HamburgerButton onClick={() => setMenuOpen(true)} badge={unreadMessages} />
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={consumerMenuItems} />

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-16 text-sm">Loading your bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No bookings yet</p>
            <p className="text-sm mt-1">Your booking history will appear here</p>
            <button
              onClick={() => navigate('/consumer')}
              className="mt-6 bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Find a pro
            </button>
          </div>
        ) : (
          <>
            {/* Active bookings */}
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                  Active · {active.length}
                </h2>
                {active.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onClick={() => navigate(`/consumer/booking/${b.id}`)}
                  />
                ))}
              </section>
            )}

            {/* Past bookings */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Past · {past.length}
                </h2>
                {past.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onClick={() => navigate(`/consumer/booking/${b.id}`)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
