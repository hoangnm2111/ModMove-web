import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { useCargoTypes, usePlatformSettings, usePolicies, useVehicleTypes } from '../../hooks/useDomainData';
import { formatCurrency } from '../../utils/format';
import { PolicyAccordion } from '../policy/PolicyAccordion';

interface Props {
  open: boolean;
  onClose: () => void;
}

const Empty: React.FC<{ text: string }> = ({ text }) => <p className="text-slate-500 text-center py-6">{text}</p>;

/** Giá cước theo loại xe: bảng `vehicle_types` (GET /public/VehicleTypes). */
export const VehiclePriceModal: React.FC<Props> = ({ open, onClose }) => {
  const vehicles = useVehicleTypes().filter((v) => v.isActive);
  const { loadingFee } = usePlatformSettings();
  const cargo = useCargoTypes();
  return (
    <Modal open={open} onClose={onClose} title="Bảng giá theo loại xe và loại hàng hoá" size="lg">
      {vehicles.length === 0 ? (
        <Empty text="Chưa có bảng giá." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3 font-bold">Loại xe</th>
                  <th className="py-2 pr-3 font-bold">Tải trọng</th>
                  <th className="py-2 pr-3 font-bold">Giá mở cửa</th>
                  <th className="py-2 pr-3 font-bold">Mỗi km</th>
                  <th className="py-2 font-bold">Tối thiểu</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-3 font-bold text-slate-900">{v.name}</td>
                    <td className="py-2.5 pr-3">{v.maxLoadKg.toLocaleString('vi-VN')} kg</td>
                    <td className="py-2.5 pr-3">{formatCurrency(v.baseFare)}</td>
                    <td className="py-2.5 pr-3">{formatCurrency(v.pricePerKm)}</td>
                    <td className="py-2.5">{formatCurrency(v.minimumFare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Phí bốc xếp {formatCurrency(loadingFee)}.</p>
        </>
      )}
      <h3 className="mt-5 mb-2 font-extrabold text-slate-900">Loại hàng hoá</h3>
      {cargo.length === 0 ? (
        <Empty text="Chưa có danh mục loại hàng hoá." />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {cargo.map((c) => (
            <li key={c.code} className="rounded-xl border border-slate-100 px-3 py-2.5">
              <div className="font-bold text-slate-900">{c.name}</div>
              {c.description && <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

/** Chính sách: `master_data_items` POLICY (GET /public/Policies). */
export const PolicyListModal: React.FC<Props> = ({ open, onClose }) => {
  const policies = usePolicies();
  return (
    <Modal open={open} onClose={onClose} title="Chính sách" size="lg">
      <PolicyAccordion items={policies} />
    </Modal>
  );
};
