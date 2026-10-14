// OWNER: Member 1 - Customer app
// PURPOSE: Icon + label for a service category
// TODO: Map each category slug to a real icon

import { StyleSheet, Text, View } from 'react-native';
import type { CategorySlug } from '@helpdesk/shared';

export function CategoryIcon({ slug, name }: { slug: CategorySlug; name: string }) {
  return (
    <View style={styles.box} accessibilityLabel={name}>
      <Text>{slug.slice(0, 2).toUpperCase()}</Text>
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', padding: 8 },
  label: { fontSize: 12 },
});
