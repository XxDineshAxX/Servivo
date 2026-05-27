import { Stack } from 'expo-router';

export default function ConsumerLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[bookingId]" options={{ title: 'Booking Status' }} />
    </Stack>
  );
}
