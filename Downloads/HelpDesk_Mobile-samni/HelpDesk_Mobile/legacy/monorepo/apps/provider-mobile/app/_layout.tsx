// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Root layout: wraps the app in AuthProvider and a Stack navigator
// TODO: Redirect to (auth) or (tabs) based on login state; pass SecureStore token storage to AuthProvider

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@helpdesk/shared/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
