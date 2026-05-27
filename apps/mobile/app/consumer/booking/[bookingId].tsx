import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { updateBookingStatus } from '@servivo/firebase';
import { useBooking } from '../../../src/hooks/useBooking';
import type { BookingStatus } from '@servivo/types';

const STATUS_MESSAGES: Record<BookingStatus, string> = {
  pending:     '⏳ Waiting for the pro to respond…',
  accepted:    '🎉 Pro accepted! They\'re on their way.',
  rejected:    '❌ Pro is unavailable. Try another.',
  in_progress: '🔧 Pro has arrived and is working.',
  completed:   '✅ Service complete!',
  cancelled:   'Booking was cancelled.',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b', accepted: '#3b82f6', rejected: '#ef4444',
  in_progress: '#8b5cf6', completed: '#10b981', cancelled: '#9ca3af',
};

export default function BookingStatusScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { booking, loading } = useBooking(bookingId ?? null);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const handleCancel = async () => {
    await updateBookingStatus(booking.id, 'cancelled');
    router.replace('/consumer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Booking Status</Text>

        <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[booking.status]}20` }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.statusMessage}>{STATUS_MESSAGES[booking.status]}</Text>

        <View style={styles.details}>
          <Row label="Pro" value={booking.proName} />
          <Row label="Service" value={booking.serviceType} />
          <Row label="Distance" value={`${booking.distanceKm.toFixed(1)} km`} />
          {booking.acceptedAt && (
            <Row label="Accepted" value={new Date(booking.acceptedAt).toLocaleTimeString()} />
          )}
        </View>

        {booking.status === 'pending' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {['completed', 'rejected', 'cancelled'].includes(booking.status) && (
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/consumer')}>
            <Text style={styles.primaryButtonText}>Find Another Pro</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2ff', padding: 16, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
  statusBadge: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, alignSelf: 'center', marginBottom: 12 },
  statusText: { fontWeight: '700', fontSize: 13 },
  statusMessage: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 24 },
  details: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: '#6b7280', fontSize: 14 },
  rowValue: { color: '#111827', fontWeight: '600', fontSize: 14 },
  cancelButton: {
    marginTop: 24, borderRadius: 12, paddingVertical: 14,
    backgroundColor: '#fee2e2', alignItems: 'center',
  },
  cancelButtonText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  primaryButton: {
    marginTop: 24, borderRadius: 12, paddingVertical: 14,
    backgroundColor: '#4f46e5', alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
