import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProProfile } from '@servivo/types';
import { updateProLocation, updateFcmToken } from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { useProBookings } from '../../hooks/useBooking';
import { useGeolocation } from '../../hooks/useGeolocation';
import { BookingCard } from '../../components/BookingCard';
import { Button } from '@servivo/ui';

export default function ProDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const pro = profile as ProProfile | null;
  const { location } = useGeolocation();
  const { bookings, loading } = useProBookings(pro?.uid ?? null);
  const [online, setOnline] = useState(pro?.isOnline ?? false);

  // Keep Firestore location in sync
  useEffect(() => {
    if (!pro || !location) return;
    updateProLocation(pro.uid, location, online);
  }, [location?.lat, location?.lng, online]);

  // Request FCM permission + register token
  useEffect(() => {
    if (!pro) return;
    (async () => {
      try {
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { firebaseApp } = await import('@servivo/firebase');
        const messaging = getMessaging(firebaseApp);
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (token) await updateFcmToken(pro.uid, token);
      } catch {
        // Notifications not granted — non-fatal
      }
    })();
  }, [pro?.uid]);

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    if (pro && location) await updateProLocation(pro.uid, location, next);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-gray-900">Pro Dashboard</h1>
          <p className="text-xs text-gray-500">{pro?.displayName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pro/schedule')}>
            Schedule
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Online toggle */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">
              {online ? '🟢 You are online' : '⚫ You are offline'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {online ? 'Consumers can see and book you' : 'You won\'t appear in search results'}
            </p>
          </div>
          <button
            onClick={toggleOnline}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              online ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                online ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Booking requests */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">
            Booking Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No active bookings</p>
            <p className="text-xs mt-1">Go online to start receiving requests</p>
          </div>
        ) : (
          bookings.map((b) => <BookingCard key={b.id} booking={b} proView />)
        )}
      </div>
    </div>
  );
}
