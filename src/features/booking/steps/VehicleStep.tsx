import React from 'react';
import { Check, Truck } from 'lucide-react';
import { canVehicleCarry } from '../../../domain/vehicleFit';
import { CargoDetail, VehicleType } from '../../../types/order.types';
import { formatCurrency } from '../../../utils/format';
import { Banner } from '../../../components/ui/feedback';
import { StepErrors } from '../bookingValidation';

interface Props {
  vehicles: VehicleType[];
  cargo: CargoDetail;
  selectedId: string | null;
  errors: StepErrors;
  onSelect: (id: string) => void;
}

const dims = (v: VehicleType) => `${v.cargoBed.lengthCm / 100} × ${v.cargoBed.widthCm / 100} × ${v.cargoBed.heightCm / 100} m`;

/** Bước 3: chỉ hiển thị loại xe có tải trọng và kích thước thùng phù hợp với hàng đã khai báo */
export const VehicleStep: React.FC<Props> = ({ vehicles, cargo, selectedId, errors, onSelect }) => {
  const fitting = vehicles.filter((v) => v.isActive && canVehicleCarry(v, cargo));
  return (
    <div className="space-y-3">
      {errors.vehicle && <Banner kind="error">{errors.vehicle}</Banner>}
      {fitting.length === 0 && <Banner kind="info">Chưa có loại xe chở được hàng này. Vui lòng kiểm tra lại khối lượng và kích thước hàng hoá.</Banner>}
      {fitting.map((v) => {
        const selected = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`w-full text-left bg-white border rounded-2xl p-4 flex items-start gap-3 transition ${
              selected ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-sm text-slate-900">{v.name}</span>
              <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tải trọng tối đa {v.maxLoadKg.toLocaleString('vi-VN')} kg • Thùng {dims(v)}
              </p>
              <p className="text-[11px] text-slate-500">
                Mở cửa {formatCurrency(v.baseFare)} • {formatCurrency(v.pricePerKm)}/km • Tối thiểu {formatCurrency(v.minimumFare)}
              </p>
            </div>
            {selected && <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};
