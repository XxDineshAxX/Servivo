import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NearbyAvailablePro } from '@servivo/types';
import { useAuthStore } from '../../store/authStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbyPros } from '../../hooks/useNearbyPros';
import { useCreateBooking } from '../../hooks/useBooking';
import { MapView } from '../../components/MapView';
import { ProCard } from '../../components/ProCard';
import { Button } from '@servivo/ui';

export default function ConsumerHome() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const { pros, loading: prosLoading } = useNearbyPros(location);
  const { request, loading: bookingLoading } = useCreateBooking();
  const [bookingForProId, setBookingForProId] = useState<string | null>(null);

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

  if (geoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Getting your location…
      </div>
    );
  }

  if (geoError || !location) {
    const isPermissionDenied =
      geoError?.toLowerCase().includes('denied') ||
      geoError?.toLowerCase().includes('permission');

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

    // Detect browser roughly
    const ua = navigator.userAgent;
    const browserName = ua.includes('Firefox')
      ? 'Firefox'
      : ua.includes('Safari') && !ua.includes('Chrome')
      ? 'Safari'
      : 'Chrome';

    const steps = browserSteps[browserName];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📍</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isPermissionDenied ? 'Location access blocked' : 'Location unavailable'}
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {isPermissionDenied
              ? 'Servivo needs your location to find available pros near you. Your browser is currently blocking location access for this site.'
              : `We couldn't get your location${geoError ? ': ' + geoError : '. Please try again.'}`}
          </p>

          {/* Steps */}
          {isPermissionDenied && (
            <div className="bg-indigo-50 rounded-2xl p-5 text-left mb-6">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
                How to enable in {browserName}
              </p>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Retry button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Try again
          </button>

          {/* Help text */}
          <p className="text-xs text-gray-400 mt-4">
            Your location is only used to find nearby pros and is never stored without your booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Servivo</h1>
          <p className="text-xs text-gray-500">Hi, {profile?.displayName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView center={location} pros={pros} onProClick={handleBook} />

        {/* Sidebar / Drawer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto p-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <h2 className="font-semibold text-gray-800 mb-3">
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
    </div>
  );
}
