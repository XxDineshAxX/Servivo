import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import type { NearbyAvailablePro } from '@servivo/types';
import { useAuthStore } from '../../src/store/authStore';
import { useGeolocation } from '../../src/hooks/useGeolocation';
import { useNearbyPros } from '../../src/hooks/useNearbyPros';
import { useCreateBooking } from '../../src/hooks/useBooking';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export default function ConsumerHomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const { location, loading: geoLoading } = useGeolocation();
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
      if (id) router.push(`/consumer/booking/${id}`);
      setBookingForProId(null);
    },
    [profile, location, request, router],
  );

  if (geoLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Pros</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {location && (
        <View style={styles.mapContainer}>
          <MapboxGL.MapView style={StyleSheet.absoluteFillObject}>
            <MapboxGL.Camera
              zoomLevel={13}
              centerCoordinate={[location.lng, location.lat]}
              animationMode="flyTo"
            />

            {/* Consumer location */}
            <MapboxGL.PointAnnotation id="consumer" coordinate={[location.lng, location.lat]}>
              <View style={styles.consumerDot} />
            </MapboxGL.PointAnnotation>

            {/* Pro markers */}
            {pros.map((pro, idx) => (
              <MapboxGL.PointAnnotation
                key={pro.proId}
                id={pro.proId}
                coordinate={[pro.lng, pro.lat]}
                onSelected={() => handleBook(pro)}
              >
                <View style={styles.proMarker}>
                  <Text style={styles.proMarkerText}>{idx + 1}</Text>
                </View>
              </MapboxGL.PointAnnotation>
            ))}
          </MapboxGL.MapView>
        </View>
      )}

      {/* Pro list */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          {prosLoading
            ? 'Finding pros…'
            : pros.length === 0
            ? 'No pros available right now'
            : `${pros.length} pro${pros.length !== 1 ? 's' : ''} available`}
        </Text>
        <FlatList
          data={pros}
          keyExtractor={(p) => p.proId}
          renderItem={({ item: pro, index }) => {
            const minsAway = Math.round((pro.nextAvailableAt - Date.now()) / 60_000);
            return (
              <View style={styles.proCard}>
                <View style={styles.proCardLeft}>
                  <Text style={styles.proCardRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.proName}>{pro.proName}</Text>
                    <Text style={styles.proMeta}>
                      📍 {pro.distanceKm.toFixed(1)} km · ⭐ {pro.rating.toFixed(1)} ·{' '}
                      ⏱ {minsAway <= 0 ? 'Now' : `${minsAway}m`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBook(pro)}
                  disabled={bookingLoading && bookingForProId === pro.proId}
                >
                  {bookingLoading && bookingForProId === pro.proId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bookButtonText}>Book</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  signOut: { fontSize: 14, color: '#4f46e5' },
  mapContainer: { height: 260 },
  listContainer: { flex: 1, padding: 16 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  proCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  proCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proCardRank: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#eef2ff', color: '#4f46e5',
    fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 28,
  },
  proName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  proMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  bookButton: {
    backgroundColor: '#4f46e5', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  consumerDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#3b82f6', borderWidth: 3, borderColor: '#fff',
  },
  proMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  proMarkerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
