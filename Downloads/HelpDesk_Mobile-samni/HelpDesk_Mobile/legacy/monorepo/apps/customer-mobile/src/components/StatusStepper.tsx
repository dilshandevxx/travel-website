// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Shows the 6 booking steps and highlights the current one
// TODO: Style as a vertical timeline with timestamps from StatusHistory

import { StyleSheet, Text, View } from 'react-native';
import { BOOKING_TRACKER_STEPS, type BookingStatus } from '@helpdesk/shared';

export function StatusStepper({ status }: { status: BookingStatus }) {
  return (
    <View style={styles.list}>
      {BOOKING_TRACKER_STEPS.map((step) => (
        <Text key={step} style={step === status ? styles.current : undefined}>
          {step}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  current: { fontWeight: '700' },
});
