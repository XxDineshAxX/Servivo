import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProProfile } from '@servivo/types';
import { updateProLocation, updateFcmToken } from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { useProBookings } from '../../hooks/useBooking';
import { useGeolocation } from '../../hooks/useGeolocation';
import { BookingCard } from '../../components/BookingCard';
import { Button } from '@servivo/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function ProDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const pro = profile as ProProfile | null;
  const { location, error: geoError } = useGeolocation();
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

  const locationBlocked =
    geoError?.toLowerCase().includes('denied') ||
    geoError?.toLowerCase().includes('permission');

  const ua = navigator.userAgent;
  const browserName = ua.includes('Firefox')
    ? 'Firefox'
    : ua.includes('Safari') && !ua.includes('Chrome')
    ? 'Safari'
    : 'Chrome';

  const browserSteps: Record<string, string[]> = {
    Chrome: [
      'Click the lock icon 🔒 in the address bar',
      'Select "Site settings"',
      'Set Location to "Allow"',
      'Refresh this page',
    ],
    Firefox: [
      'Click the shield icon in the address bar',
      'Click "Connection secure" → "More information"',
      'Go to the "Permissions" tab',
      'Set Location to "Allow"',
      'Refresh this page',
    ],
    Safari: [
      'Open Safari → Settings (⌘,)',
      'Go to "Websites" → "Location"',
      'Find this site and set it to "Allow"',
      'Refresh this page',
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">Pro Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{pro?.displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/pro/schedule')}>
            Schedule
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">

        {/* Location permission banner */}
        {(geoError || !location) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
            <div className="flex gap-3 items-start mb-3">
              <span className="text-2xl flex-shrink-0">📍</span>
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  {locationBlocked ? 'Location access is blocked' : 'Location unavailable'}
                </p>
                <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                  {locationBlocked
                    ? `Your browser is blocking location access. Without it, consumers won't be able to find you — even when you're online.`
                    : `We couldn't get your location${geoError ? ': ' + geoError : '. Please try again.'}. Consumers won't be able to find you until this is resolved.`}
                </p>
              </div>
            </div>

            {locationBlocked && (
              <div className="bg-white rounded-xl p-4 mb-3">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
                  How to enable in {browserName}
                </p>
                <ol className="space-y-1.5">
                  {browserSteps[browserName].map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-gray-700">
                      <span className="flex-shrink-0 w-4 h-4 bg-amber-500 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              Reload after enabling location
            </button>
          </div>
        )}

        {/* Online toggle */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">
                {online ? '🟢 You are online' : '⚫ You are offline'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {online
                  ? location
                    ? 'Consumers nearby can see and book you'
                    : 'Enable location above so consumers can find you'
                  : "You won't appear in search results"}
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

          {/* Schedule tip — only show when online so they know slots are optional extras */}
          {online && location && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <p className="text-xs text-gray-400">
                💡 Add scheduled slots to pre-block your availability windows
              </p>
              <button
                onClick={() => navigate('/pro/schedule')}
                className="text-xs text-indigo-600 font-medium hover:underline ml-3 whitespace-nowrap"
              >
                Manage →
              </button>
            </div>
          )}
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
