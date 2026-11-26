import React from 'react';
import { Field, TextArea } from '../../../components/ui/Field';
import { PhotoUploader } from '../../../components/ui/PhotoUploader';
import { BUSINESS } from '../../../config/business';
import { useCargoTypes } from '../../../hooks/useDomainData';
import { customerUploadService } from '../../../services/customer-upload.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { CargoDetail } from '../../../types/order.types';
import { StepErrors } from '../bookingValidation';

interface Props {
  cargo: CargoDetail;
  errors: StepErrors;
  onChange: (c: Partial<CargoDetail>) => void;
}

/** Chỉ nhận số nguyên: bỏ mọi ký tự không phải chữ số (dấu ., e, +, -) */
const num = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits === '' ? 0 : Number(digits);
};
/** Chặn gõ dấu thập phân / số mũ / dấu âm ngay từ bàn phím */
const intOnly = {
  step: 1,
  inputMode: 'numeric' as const,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  },
};

/** Bước 2: khai báo hàng hoá */
export const CargoStep: React.FC<Props> = ({ cargo, errors, onChange }) => {
  const cargoTypes = useCargoTypes();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // GB-28 / UC-GST-05 bước 5: khách chưa đăng nhập vẫn thêm ảnh; ảnh nằm trong nháp (data URL) và được tải lên khi gửi đơn
  const upload = isAuthenticated ? customerUploadService.uploadImage : undefined;
  return (
  <div className="space-y-4">
    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900">Thông tin hàng hoá</h3>
      <div>
        <span className="block text-xs font-bold text-slate-700 mb-1">Loại hàng *</span>
        <div className="flex flex-wrap gap-2">
          {cargoTypes.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => onChange({ type: o.code })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                cargo.type.toLowerCase() === o.code.toLowerCase() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </div>
      <TextArea
        label="Mô tả hàng hoá"
        required
        maxLength={BUSINESS.MAX_NOTE_LENGTH}
        value={cargo.description}
        error={errors['cargo.description']}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Số lượng kiện"
          required
          type="number"
          min={1}
          {...intOnly}
          value={cargo.quantity || ''}
          error={errors['cargo.quantity']}
          onChange={(e) => onChange({ quantity: num(e.target.value) })}
        />
        <Field
          label="Tổng khối lượng kg"
          required
          type="number"
          min={1}
          {...intOnly}
          value={cargo.weightKg || ''}
          error={errors['cargo.weightKg']}
          onChange={(e) => onChange({ weightKg: num(e.target.value) })}
        />
      </div>
      <div>
        <span className="block text-xs font-bold text-slate-700 mb-1">Kích thước kiện lớn nhất cm *</span>
        <div className="grid grid-cols-3 gap-2">
          {(['lengthCm', 'widthCm', 'heightCm'] as const).map((k, i) => (
            <Field
              key={k}
              label={['Dài', 'Rộng', 'Cao'][i]}
              type="number"
              min={1}
              {...intOnly}
              value={cargo.largestItem[k] || ''}
              onChange={(e) =>
                onChange({
                  largestItem: {
                    ...cargo.largestItem,
                    [k]: num(e.target.value),
                  },
                })
              }
            />
          ))}
        </div>
        {errors['cargo.largestItem'] && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors['cargo.largestItem']}</p>}
      </div>
      <div>
        <PhotoUploader label={`Ảnh hàng hoá (${BUSINESS.MIN_CARGO_PHOTOS}–${BUSINESS.MAX_CARGO_PHOTOS} ảnh) *`} value={cargo.photos} onChange={(photos) => onChange({ photos })} upload={upload} />
        {errors['cargo.photos'] && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors['cargo.photos']}</p>}
      </div>
      <TextArea
        label="Ghi chú bốc xếp đặc biệt"
        value={cargo.specialNotes ?? ''}
        error={errors['cargo.specialNotes']}
        onChange={(e) => onChange({ specialNotes: e.target.value })}
      />
    </section>
  </div>
  );
};
