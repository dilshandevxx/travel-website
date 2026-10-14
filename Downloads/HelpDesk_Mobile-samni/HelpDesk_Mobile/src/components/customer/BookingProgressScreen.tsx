import React from 'react';
import { LiveServiceTracker } from './LiveServiceTracker';

export interface BookingProgressScreenProps {
  requestId: string;
  onBack: () => void;
  onOpenChat: (bookingId: string) => void;
  onBookingUpdated?: (booking: any) => void;
  onBookAnother?: () => void;
  onReturnHome?: () => void;
}

export const BookingProgressScreen: React.FC<BookingProgressScreenProps> = ({
  requestId,
  onBack,
  onOpenChat,
  onBookingUpdated,
  onBookAnother,
  onReturnHome
}) => {
  return (
    <LiveServiceTracker
      bookingId={requestId}
      onBack={onBack}
      onOpenChat={onOpenChat}
      onBookingUpdated={onBookingUpdated}
      onBookAnother={onBookAnother}
      onReturnHome={onReturnHome}
      hideTopHeader={true}
    />
  );
};