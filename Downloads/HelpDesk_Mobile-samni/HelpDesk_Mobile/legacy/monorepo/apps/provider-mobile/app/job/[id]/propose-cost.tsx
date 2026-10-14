// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Propose a cost for a job
// TODO: Amount (LKR) + note -> POST /service-requests/:id/propose-cost

import { StyleSheet, Text, View } from 'react-native';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Propose cost</Text>
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
