// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Welcome / onboarding screen
// TODO: Build onboarding slides and buttons to login/register

import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HelpDesk Pro</Text>
      <Text style={styles.subtitle}>Member 2 - Provider app / onboarding / e2e</Text>
      <Link href="/login" style={styles.link}>
        Log in
      </Link>
      <Link href="/register" style={styles.link}>
        Create account
      </Link>
      <Link href="/radar" style={styles.link}>
        Skip to app (dev only)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },
  link: { fontSize: 16, color: '#2563eb', marginTop: 8 },
});
