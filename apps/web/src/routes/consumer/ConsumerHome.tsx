import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NearbyAvailablePro, ConsumerProfile, ProProfile } from '@servivo/types';
import { useAuthStore } from '../../store/authStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbyPros } from '../../hooks/useNearbyPros';
import { useCreateBooking } from '../../hooks/useBooking';
import { getSavedProProfiles, unsavePro } from '@servivo/firebase';
import { MapView } from '../../components/MapView';
import { ProCard } from '../../components/ProCard';
import { SideMenu, HamburgerButton } from '../../components/SideMenu';

type Tab = 'nearby' | 'saved';

export default function ConsumerHome() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuthStore();
  const consumer = profile as ConsumerProfile | null;

  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const { pros, loading: prosLoading } = useNearbyPros(location);
  const { request, loading: bookingLoading } = useCreateBooking();

  const [bookingForProId, setBookingForProId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('nearby');
  const [menuOpen, setMenuOpen] = useState(false);

  const consumerMenuItems = [
    { icon: '🏠', label: 'Home',     path: '/consumer' },
    { icon: '📋', label: 'Bookings', path: '/consumer/bookings' },
    { icon: '💬', label: 'Messages', path: '/consumer/chats' },
  ];
  const [savedPros, setSavedPros] = useState<ProProfile[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Load saved pro profiles whenever the saved IDs change
  useEffect(() => {
    if (tab !== 'saved' || !consumer) return;
    setSavedLoading(true);
    getSavedProProfiles(consumer.savedProIds ?? [])
      .then(setSavedPros)
      .finally(() => setSavedLoading(false));
  }, [tab, consumer?.savedProIds?.join(',')]);

  const handleBook = useCallback(
    async (pro: NearbyAvailablePro) => {
      if (!profile || !location) return;
      setBookingForProId(pro.proId);
      const id = await request({
        consumerId: profile.uid,
        consumerName: profile.displayName,
        proId: pro.proId,
        serviceType: pro.serviceTypes[0] ?? 'General',
        consumerLocation: location,
        distanceKm: pro.distanceKm,
      });
      if (id) navigate(`/consumer/booking/${id}`);
      setBookingForProId(null);
    },
    [profile, location, request, navigate],
  );

  const handleUnsave = async (proId: string) => {
    if (!consumer) return;
    const newIds = (consumer.savedProIds ?? []).filter((id) => id !== proId);
    setProfile({ ...consumer, savedProIds: newIds });
    setSavedPros((prev) => prev.filter((p) => p.uid !== proId));
    await unsavePro(consumer.uid, proId);
  };

  // ── Location loading ──────────────────────────────────────────────────────
  if (geoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400 dark:bg-gray-900">
        Getting your location…
      </div>
    );
  }

  // ── Location blocked / error ──────────────────────────────────────────────
  if (geoError || !location) {
    const isPermissionDenied =
      geoError?.toLowerCase().includes('denied') ||
      geoError?.toLowerCase().includes('permission');

    const browserSteps: Record<string, string[]> = {
      Chrome: ['Click the lock icon 🔒 in the address bar', 'Select "Site settings"', 'Set Location to "Allow"', 'Refresh this page'],
      Firefox: ['Click the shield icon in the address bar', 'Click "Connection secure" → "More information"', 'Go to the "Permissions" tab', 'Set Location to "Allow"', 'Refresh this page'],
      Safari: ['Open Safari → Settings (⌘,)', 'Go to "Websites" → "Location"', 'Find this site and set it to "Allow"', 'Refresh this page'],
    };

    const ua = navigator.userAgent;
    const browserName = ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') && !ua.includes('Chrome') ? 'Safari' : 'Chrome';
    const steps = browserSteps[browserName];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📍</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {isPermissionDenied ? 'Location access blocked' : 'Location unavailable'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
            {isPermissionDenied
              ? 'Servivo needs your location to find available pros near you. Your browser is currently blocking location access for this site.'
              : `We couldn't get your location${geoError ? ': ' + geoError : '. Please try again.'}`}
          </p>
          {isPermissionDenied && (
            <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl p-5 text-left mb-6">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-3">How to enable in {browserName}</p>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">Try again</button>
          <p className="text-xs text-gray-400 mt-4">Your location is only used to find nearby pros and is never stored without your booking.</p>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">Servivo</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Hi, {profile?.displayName}</p>
        </div>
        <HamburgerButton onClick={() => setMenuOpen(true)} />
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={consumerMenuItems} />

      {/* Tab bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex">
        {(['nearby', 'saved'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'nearby' ? '📍 Nearby' : '❤️ Saved'}
            {t === 'saved' && (consumer?.savedProIds?.length ?? 0) > 0 && (
              <span className="ml-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full px-1.5 py-0.5">
                {consumer?.savedProIds?.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'nearby' ? (
        <div className="flex-1 relative">
          <MapView center={location} pros={pros} onProClick={handleBook} />
          {/* Bottom drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto p-4">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {prosLoading
                ? 'Finding pros near you…'
                : pros.length === 0
                ? 'No pros available right now'
                : `${pros.length} pro${pros.length > 1 ? 's' : ''} available nearby`}
            </h2>
            {pros.map((pro, idx) => (
              <ProCard
                key={pro.proId}
                pro={pro}
                rank={idx + 1}
                onBook={handleBook}
                loading={bookingLoading && bookingForProId === pro.proId}
              />
            ))}
          </div>
        </div>
      ) : (
        // Saved pros list
        <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
          {savedLoading ? (
            <p className="text-center text-gray-400 py-12 text-sm">Loading…</p>
          ) : savedPros.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🤍</p>
              <p className="font-medium text-gray-600 dark:text-gray-400">No saved pros yet</p>
              <p className="text-sm mt-1">Tap the heart on a pro's card to save them for later</p>
            </div>
          ) : (
            savedPros.map((pro) => (
              <div
                key={pro.uid}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-3 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                    {pro.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{pro.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pro.serviceTypes.join(', ')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ⭐ {pro.rating.toFixed(1)} · {pro.completedBookings} jobs
                    {pro.isOnline && <span className="ml-2 text-green-600 dark:text-green-400">● Online</span>}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/consumer/chat/${pro.uid}`)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    💬 Message
                  </button>
                  <button
                    onClick={() => handleUnsave(pro.uid)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
