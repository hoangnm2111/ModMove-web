import React from 'react';
import { BookingWizard } from '../../features/booking/BookingWizard';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { useOrderStore } from '../../store/useOrderStore';

export const BookingPage: React.FC = () => {
  const { pickup, dropoff } = useOrderStore();

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left Booking Drawer */}
      <BookingWizard />

      {/* Right Map Canvas */}
      <div className="flex-1 h-full relative">
        <MapPlaceholder pickup={pickup} dropoff={dropoff} showActiveDrivers={true} />
      </div>
    </div>
  );
};
