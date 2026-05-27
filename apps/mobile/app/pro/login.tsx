import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signUpPro } from '@servivo/firebase';

type Mode = 'login' | 'signup';

const SERVICE_OPTIONS = ['Plumber', 'Electrician', 'HVAC', 'Handyman', 'Cleaner', 'Painter', 'Locksmith'];

export default function ProLoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleService = (s: string) =>
    setServiceTypes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = async () => {
    if (mode === 'signup' && serviceTypes.length === 0) {
      Alert.alert('Select services', 'Please choose at least one service type.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUpPro(email, password, displayName, serviceTypes);
      }
      router.replace('/pro');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{mode === 'login' ? 'Pro sign in' : 'Join as a pro'}</Text>
        <Text style={styles.subtitle}>Professional portal</Text>

        {mode === 'signup' && (
          <>
            <TextInput style={styles.input} placeholder="Full name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
            <Text style={styles.label}>Services offered</Text>
            <View style={styles.serviceGrid}>
              {SERVICE_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleService(s)}
                  style={[styles.serviceChip, serviceTypes.includes(s) && styles.serviceChipActive]}
                >
                  <Text style={[styles.serviceChipText, serviceTypes.includes(s) && styles.serviceChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 24, paddingTop: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  serviceChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  serviceChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  serviceChipText: { fontSize: 13, color: '#374151' },
  serviceChipTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  toggle: { color: '#4f46e5', textAlign: 'center', fontSize: 14, marginBottom: 12 },
  back: { color: '#9ca3af', textAlign: 'center', fontSize: 13 },
});
