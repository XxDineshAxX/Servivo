import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@servivo/types';
import type { ProProfile } from '@servivo/types';
import { useAuthStore } from '../../store/authStore';
import { useAllProBookings } from '../../hooks/useBooking';
import { StatusBadge, Button } from '@servivo/ui';
import { updateBookingStatus } from '@servivo/firebase';
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

function ProBookingRow({ booking }: { booking: Booking }) {
  const navigate = useNavigate();
  const [acting, setActing] = useState(false);

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{statusIcon[booking.status] ?? '📋'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{booking.consumerName}</p>
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
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" loading={acting} onClick={handleComplete}>
            Mark Complete
          </Button>
          <button
            onClick={() => navigate(`/pro/chat/${booking.consumerId}`)}
            className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
          >
            💬 Message
          </button>
        </div>
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
