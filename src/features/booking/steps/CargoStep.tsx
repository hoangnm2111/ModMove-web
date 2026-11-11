import React from 'react';
import { Field, TextArea } from '../../../components/ui/Field';
import { PhotoUploader } from '../../../components/ui/PhotoUploader';
import { BUSINESS } from '../../../config/business';
import { useCargoTypes } from '../../../hooks/useDomainData';
import { customerUploadService } from '../../../services/customer-upload.service';
import { CargoDetail } from '../../../types/order.types';
import { StepErrors } from '../bookingValidation';

interface Props {
  cargo: CargoDetail;
  agreedNoProhibitedCargo: boolean;
  errors: StepErrors;
  onChange: (c: Partial<CargoDetail>) => void;
  onAgree: (v: boolean) => void;
  onShowProhibited: () => void;
}

const num = (v: string) => (v === '' ? 0 : Number(v));

/** Bước 2 – Khai báo hàng hoá (UC-GST-10, GB-06) */
export const CargoStep: React.FC<Props> = ({ cargo, agreedNoProhibitedCargo, errors, onChange, onAgree, onShowProhibited }) => {
  const cargoTypes = useCargoTypes();
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
                cargo.type === o.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
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
        placeholder="VD: 1 tủ quần áo 2 cánh, 1 đệm 1m6, 5 thùng carton"
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
          value={cargo.quantity || ''}
          error={errors['cargo.quantity']}
          onChange={(e) => onChange({ quantity: num(e.target.value) })}
        />
        <Field
          label="Tổng khối lượng (kg)"
          required
          type="number"
          min={1}
          value={cargo.weightKg || ''}
          error={errors['cargo.weightKg']}
          onChange={(e) => onChange({ weightKg: num(e.target.value) })}
        />
      </div>
      <div>
        <span className="block text-xs font-bold text-slate-700 mb-1">Kích thước kiện lớn nhất (cm) * – dùng để kiểm tra thùng xe</span>
        <div className="grid grid-cols-3 gap-2">
          {(['lengthCm', 'widthCm', 'heightCm'] as const).map((k, i) => (
            <Field
              key={k}
              label={['Dài', 'Rộng', 'Cao'][i]}
              type="number"
              min={1}
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
        <PhotoUploader label={`Ảnh hàng hoá (${BUSINESS.MIN_CARGO_PHOTOS}–${BUSINESS.MAX_CARGO_PHOTOS} ảnh) *`} value={cargo.photos} onChange={(photos) => onChange({ photos })} upload={customerUploadService.uploadImage} />
        {errors['cargo.photos'] && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors['cargo.photos']}</p>}
      </div>
      <TextArea
        label="Ghi chú bốc xếp đặc biệt"
        placeholder="VD: hàng dễ vỡ, không lật úp…"
        value={cargo.specialNotes ?? ''}
        onChange={(e) => onChange({ specialNotes: e.target.value })}
      />
    </section>

    <label className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 cursor-pointer">
      <input type="checkbox" className="mt-0.5" checked={agreedNoProhibitedCargo} onChange={(e) => onAgree(e.target.checked)} />
      <span>
        Tôi cam kết hàng hoá không thuộc danh mục hàng cấm (chất nổ, động vật sống, rác thải y tế…).{' '}
        <button type="button" className="text-blue-600 font-bold underline" onClick={onShowProhibited}>
          Xem danh mục
        </button>
        {errors.agreedNoProhibitedCargo && <span className="block mt-1 text-rose-600 font-semibold">{errors.agreedNoProhibitedCargo}</span>}
      </span>
    </label>
  </div>
  );
};
