import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { ProProfile } from '@servivo/types';
import { addAvailabilitySlot } from '@servivo/firebase';
import { useAuthStore } from '../../src/store/authStore';

export default function ProScheduleScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const pro = profile as ProProfile | null;

  // Simple date/time inputs stored as strings
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date || !startTime || !endTime) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    const startAt = new Date(`${date}T${startTime}`).getTime();
    const endAt = new Date(`${date}T${endTime}`).getTime();
    if (isNaN(startAt) || isNaN(endAt)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD and HH:MM format.');
      return;
    }
    if (endAt <= startAt) {
      Alert.alert('Invalid range', 'End time must be after start time.');
      return;
    }
    if (!pro) return;

    setSaving(true);
    try {
      await addAvailabilitySlot({ proId: pro.uid, startAt, endAt });
      Alert.alert('✓ Slot added', `${date} ${startTime}–${endTime}`);
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.description}>
          Add time windows when you're available to accept bookings. Consumers will only see you during these slots.
        </Text>

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-06-01"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Start time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="09:00"
          value={startTime}
          onChangeText={setStartTime}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>End time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="13:00"
          value={endTime}
          onChangeText={setEndTime}
          keyboardType="numbers-and-punctuation"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Availability Slot</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={styles.back}>← Back to dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 24 },
  description: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  back: { color: '#4f46e5', textAlign: 'center', fontSize: 14 },
});
