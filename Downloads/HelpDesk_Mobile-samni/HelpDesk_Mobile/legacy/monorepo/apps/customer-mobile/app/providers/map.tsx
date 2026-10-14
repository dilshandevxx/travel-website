// OWNER: Member 1 - Customer app
// PURPOSE: Map of nearby providers
// TODO: Show providers on a map around the customer location

import { StyleSheet, Text, View } from 'react-native';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Providers map</Text>
      <Text style={styles.subtitle}>Member 1 - Customer app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },
  link: { fontSize: 16, color: '#2563eb', marginTop: 8 },
});
