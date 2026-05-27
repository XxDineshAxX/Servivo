import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import type { ProProfile } from '@servivo/types';
import { updateProLocation, updateFcmToken } from '@servivo/firebase';
import { updateBookingStatus } from '@servivo/firebase';
import { useAuthStore } from '../../src/store/authStore';
import { useProBookings } from '../../src/hooks/useBooking';
import { useGeolocation } from '../../src/hooks/useGeolocation';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function ProDashboardScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const pro = profile as ProProfile | null;
  const { location } = useGeolocation();
  const { bookings, loading } = useProBookings(pro?.uid ?? null);
  const [online, setOnline] = useState(pro?.isOnline ?? false);
  const [acting, setActing] = useState<string | null>(null);

  // Sync location + online status
  useEffect(() => {
    if (!pro || !location) return;
    updateProLocation(pro.uid, location, online);
  }, [location?.lat, location?.lng, online]);

  // Register for push notifications via Expo
  useEffect(() => {
    if (!pro) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const tokenData = await Notifications.getExpoPushTokenAsync();
      await updateFcmToken(pro.uid, tokenData.data);
    })();
  }, [pro?.uid]);

  const handleRespond = async (bookingId: string, status: 'accepted' | 'rejected') => {
    setActing(bookingId);
    await updateBookingStatus(bookingId, status);
    setActing(null);
  };

  const toggleOnline = async (value: boolean) => {
    setOnline(value);
    if (pro && location) await updateProLocation(pro.uid, location, value);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>{pro?.displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/pro/schedule')} style={styles.scheduleBtn}>
            <Text style={styles.scheduleBtnText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online toggle */}
      <View style={styles.onlineCard}>
        <View>
          <Text style={styles.onlineTitle}>{online ? '🟢 Online' : '⚫ Offline'}</Text>
          <Text style={styles.onlineSub}>{online ? 'Accepting bookings' : 'Hidden from consumers'}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          trackColor={{ false: '#d1d5db', true: '#6366f1' }}
          thumbColor={online ? '#4f46e5' : '#f3f4f6'}
        />
      </View>

      {/* Booking list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Requests{pendingCount > 0 && <Text style={styles.badge}> {pendingCount} new</Text>}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No active bookings</Text>
          <Text style={styles.emptySubText}>Go online to start receiving requests</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item: booking }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingConsumer}>{booking.consumerName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(booking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor(booking.status) }]}>
                    {booking.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.bookingMeta}>
                {booking.serviceType} · 📍 {booking.distanceKm.toFixed(1)} km ·{' '}
                {new Date(booking.createdAt).toLocaleTimeString()}
              </Text>
              {booking.note && <Text style={styles.bookingNote}>"{booking.note}"</Text>}

              {booking.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleRespond(booking.id, 'accepted')}
                    disabled={acting === booking.id}
                  >
                    {acting === booking.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleRespond(booking.id, 'rejected')}
                    disabled={acting === booking.id}
                  >
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b', accepted: '#3b82f6', rejected: '#ef4444',
    in_progress: '#8b5cf6', completed: '#10b981', cancelled: '#9ca3af',
  };
  return colors[status] ?? '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6b7280' },
  headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  scheduleBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  scheduleBtnText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  signOut: { color: '#9ca3af', fontSize: 13 },
  onlineCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  onlineTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  onlineSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { color: '#ef4444' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#9ca3af' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingConsumer: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bookingMeta: { fontSize: 13, color: '#6b7280' },
  bookingNote: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4f46e5' },
  rejectBtn: { backgroundColor: '#fee2e2' },
  actionBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
});
