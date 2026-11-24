import React from 'react';
import { Field } from '../../../components/ui/Field';
import { BUSINESS } from '../../../config/business';
import { LocationPoint } from '../../../types/order.types';
import { AddressInput } from '../AddressInput';
import { StepErrors } from '../bookingValidation';

interface Props {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  errors: StepErrors;
  onPickup: (p: Partial<LocationPoint>) => void;
  onDropoff: (p: Partial<LocationPoint>) => void;
}

const PointCard: React.FC<{
  kind: 'pickup' | 'dropoff';
  point: LocationPoint;
  errors: StepErrors;
  onChange: (p: Partial<LocationPoint>) => void;
}> = ({ kind, point, errors, onChange }) => {
  const isPickup = kind === 'pickup';
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${isPickup ? 'bg-blue-600' : 'bg-emerald-600'}`} />
        {isPickup ? 'Điểm lấy hàng' : 'Điểm giao hàng'}
      </h3>
      <AddressInput
        id={`${kind}-address`}
        label="Địa chỉ"
        value={point.address}
        error={errors[`${kind}.address`]}
        onType={(address) => onChange({ address, lat: 0, lng: 0 })}
        onSelect={(p) => onChange(p)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label={isPickup ? 'Tên người gửi' : 'Tên người nhận'}
          required
          maxLength={100}
          value={point.contactName}
          error={errors[`${kind}.contactName`]}
          onChange={(e) => onChange({ contactName: e.target.value })}
        />
        <Field
          label={isPickup ? 'Số điện thoại người gửi' : 'Số điện thoại người nhận'}
          required
          inputMode="tel"
          maxLength={20}
          placeholder="09xxxxxxxx"
          value={point.contactPhone}
          error={errors[`${kind}.contactPhone`]}
          onChange={(e) => onChange({ contactPhone: e.target.value })}
        />
      </div>
      <Field
        id={`${kind}-note`}
        label="Ghi chú"
        maxLength={BUSINESS.MAX_NOTE_LENGTH}
        value={point.note ?? ''}
        error={errors[`${kind}.note`]}
        onChange={(e) => onChange({ note: e.target.value })}
      />
    </section>
  );
};

/** Bước 1: lộ trình, đúng 1 điểm lấy và 1 điểm giao */
export const RouteStep: React.FC<Props> = ({ pickup, dropoff, errors, onPickup, onDropoff }) => (
  <div className="space-y-4">
    <PointCard kind="pickup" point={pickup} errors={errors} onChange={onPickup} />
    <PointCard kind="dropoff" point={dropoff} errors={errors} onChange={onDropoff} />
  </div>
);
