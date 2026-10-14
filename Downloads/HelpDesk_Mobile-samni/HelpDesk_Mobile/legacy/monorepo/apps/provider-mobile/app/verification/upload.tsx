// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Upload NIC / certificates for verification
// TODO: Document picker + POST /providers/me/verification

import { StyleSheet, Text, View } from 'react-native';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload documents</Text>
      <Text style={styles.subtitle}>Member 2 - Provider app / onboarding / e2e</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },
  link: { fontSize: 16, color: '#2563eb', marginTop: 8 },
});
