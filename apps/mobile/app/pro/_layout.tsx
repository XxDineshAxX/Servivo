import { Stack } from 'expo-router';

export default function ProLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="schedule" options={{ title: 'My Schedule' }} />
    </Stack>
  );
}
