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
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-red-500 font-medium mb-2">Location access required</p>
          <p className="text-sm text-gray-500">{geoError}</p>
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
