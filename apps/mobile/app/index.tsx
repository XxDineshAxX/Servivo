import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function LandingScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (profile?.role === 'consumer') router.replace('/consumer');
    else if (profile?.role === 'pro') router.replace('/pro');
  }, [profile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Servivo</Text>
        <Text style={styles.tagline}>Book the nearest pro — within the hour.</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => router.push('/consumer/login')}
        >
          <Text style={styles.buttonPrimaryText}>I need a pro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/pro/login')}
        >
          <Text style={styles.buttonSecondaryText}>I'm a professional</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2ff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 40, fontWeight: '800', color: '#1e1b4b', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 48 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 14, marginBottom: 12, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#4f46e5' },
  buttonPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  buttonSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 16 },
});
