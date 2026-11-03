import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { msg } from '../../constants/messages';
import { useCoupons, useVehicleTypes } from '../../hooks/useDomainData';
import { catalogService } from '../../services/catalog.service';
import { errorMessage } from '../../services/mock/storage';
import { Coupon, VehicleType } from '../../types/order.types';
import { formatCurrency, formatDateTime } from '../../utils/format';

type VehicleForm = Omit<VehicleType, 'id'> & { id?: string };
type CouponForm = Omit<Coupon, 'id' | 'usedCount'> & { id?: string };

const emptyVehicle = (): VehicleForm => ({
  name: '',
  description: '',
  baseFare: 0,
  pricePerKm: 0,
  minimumFare: 0,
  maxLoadKg: 500,
  cargoBed: { lengthCm: 180, widthCm: 140, heightCm: 120 },
  iconType: 'truck',
  isActive: true,
});

const emptyCoupon = (): CouponForm => {
  const now = new Date();
  const next = new Date(now.getTime() + 30 * 86_400_000);
  return { code: '', discountValue: 20_000, minimumOrderValue: 150_000, validFrom: now.toISOString(), validTo: next.toISOString(), usageLimit: 100, isActive: true };
};

const toDateInput = (iso: string) => iso.slice(0, 10);

/** SCR-36 – Quản lý master data: loại xe & mã giảm giá (UC-ADM-14/15/16) */
export const AdminMasterDataPage: React.FC = () => {
  const vehicles = useVehicleTypes();
  const coupons = useCoupons();
  const [tab, setTab] = useState<'vehicles' | 'coupons'>('vehicles');
  const [vehicleForm, setVehicleForm] = useState<VehicleForm | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveVehicle = async () => {
    if (!vehicleForm) return;
    setSaving(true);
    setError(null);
    try {
      await catalogService.saveVehicleType(vehicleForm);
      toast.success(msg('MSG04', { record_name: 'loại xe' }));
      setVehicleForm(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const saveCoupon = async () => {
    if (!couponForm) return;
    setSaving(true);
    setError(null);
    try {
      await catalogService.saveCoupon(couponForm);
      toast.success(msg('MSG04', { record_name: 'mã giảm giá' }));
      setCouponForm(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kind: 'vehicle' | 'coupon', id: string, name: string, next: boolean) => {
    if (!(await confirm({ title: next ? 'Kích hoạt' : 'Ngừng hoạt động', message: msg('MSG62', { action_name: `${next ? 'kích hoạt' : 'ngừng'} ${name}` }) }))) return;
    try {
      if (kind === 'vehicle') await catalogService.setVehicleTypeActive(id, next);
      else await catalogService.setCouponActive(id, next);
      toast.success(msg('MSG04', { record_name: 'trạng thái' }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 min-w-0">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <header className="flex items-center gap-3">
          <h1 className="text-lg font-black text-slate-900 mr-auto">Danh mục hệ thống</h1>
          <Button
            size="sm"
            onClick={() => {
              setError(null);
              if (tab === 'vehicles') setVehicleForm(emptyVehicle());
              else setCouponForm(emptyCoupon());
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> {tab === 'vehicles' ? 'Thêm loại xe' : 'Thêm mã giảm giá'}
          </Button>
        </header>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit" role="tablist">
          {(['vehicles', 'coupons'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === t ? 'bg-white shadow' : 'text-slate-500'}`}>
              {t === 'vehicles' ? `Loại xe (${vehicles.length})` : `Mã giảm giá (${coupons.length})`}
            </button>
          ))}
        </div>

        {tab === 'vehicles' ? (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="p-3">Tên</th>
                  <th className="p-3">Tải trọng</th>
                  <th className="p-3">Thùng xe (cm)</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold">{v.name}</td>
                    <td className="p-3">{v.maxLoadKg.toLocaleString('vi-VN')} kg</td>
                    <td className="p-3">
                      {v.cargoBed.lengthCm} × {v.cargoBed.widthCm} × {v.cargoBed.heightCm}
                    </td>
                    <td className="p-3">
                      {formatCurrency(v.baseFare)} + {formatCurrency(v.pricePerKm)}/km
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${v.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{v.isActive ? 'Hoạt động' : 'Ngừng'}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-2">
                      <button className="font-bold text-blue-600" onClick={() => { setError(null); setVehicleForm(v); }}>
                        Sửa
                      </button>
                      <button className="font-bold text-slate-600" onClick={() => toggle('vehicle', v.id, v.name, !v.isActive)}>
                        {v.isActive ? 'Ngừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="p-3">Mã</th>
                  <th className="p-3">Giảm</th>
                  <th className="p-3">Đơn tối thiểu</th>
                  <th className="p-3">Hiệu lực</th>
                  <th className="p-3">Đã dùng</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="p-3 font-black">{c.code}</td>
                    <td className="p-3">{formatCurrency(c.discountValue)}</td>
                    <td className="p-3">{formatCurrency(c.minimumOrderValue)}</td>
                    <td className="p-3">
                      {formatDateTime(c.validFrom)} – {formatDateTime(c.validTo)}
                    </td>
                    <td className="p-3">
                      {c.usedCount}/{c.usageLimit}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.isActive ? 'Hoạt động' : 'Ngừng'}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-2">
                      <button className="font-bold text-blue-600" onClick={() => { setError(null); setCouponForm(c); }}>
                        Sửa
                      </button>
                      <button className="font-bold text-slate-600" onClick={() => toggle('coupon', c.id, c.code, !c.isActive)}>
                        {c.isActive ? 'Ngừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {vehicleForm && (
        <Modal open title={vehicleForm.id ? 'Sửa loại xe' : 'Thêm loại xe'} onClose={() => setVehicleForm(null)} footer={<Button size="sm" onClick={saveVehicle} isLoading={saving}>Lưu</Button>}>
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2" label="Tên loại xe" required value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
            <Field className="col-span-2" label="Mô tả" value={vehicleForm.description} onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })} />
            <Field label="Giá mở cửa (đ)" type="number" value={vehicleForm.baseFare} onChange={(e) => setVehicleForm({ ...vehicleForm, baseFare: Number(e.target.value) })} />
            <Field label="Giá / km (đ)" type="number" value={vehicleForm.pricePerKm} onChange={(e) => setVehicleForm({ ...vehicleForm, pricePerKm: Number(e.target.value) })} />
            <Field label="Cước tối thiểu (đ)" type="number" value={vehicleForm.minimumFare} onChange={(e) => setVehicleForm({ ...vehicleForm, minimumFare: Number(e.target.value) })} />
            <Field label="Tải trọng tối đa (kg)" type="number" value={vehicleForm.maxLoadKg} onChange={(e) => setVehicleForm({ ...vehicleForm, maxLoadKg: Number(e.target.value) })} />
            {(['lengthCm', 'widthCm', 'heightCm'] as const).map((k, i) => (
              <Field
                key={k}
                label={`Thùng – ${['dài', 'rộng', 'cao'][i]} (cm)`}
                type="number"
                value={vehicleForm.cargoBed[k]}
                onChange={(e) => setVehicleForm({ ...vehicleForm, cargoBed: { ...vehicleForm.cargoBed, [k]: Number(e.target.value) } })}
              />
            ))}
          </div>
          {error && <Banner kind="error" className="mt-3">{error}</Banner>}
        </Modal>
      )}

      {couponForm && (
        <Modal open title={couponForm.id ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'} onClose={() => setCouponForm(null)} footer={<Button size="sm" onClick={saveCoupon} isLoading={saving}>Lưu</Button>}>
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2" label="Mã" required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
            <Field label="Số tiền giảm (đ)" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} />
            <Field label="Đơn tối thiểu (đ)" type="number" value={couponForm.minimumOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minimumOrderValue: Number(e.target.value) })} />
            <Field label="Bắt đầu" type="date" value={toDateInput(couponForm.validFrom)} onChange={(e) => setCouponForm({ ...couponForm, validFrom: new Date(e.target.value).toISOString() })} />
            <Field label="Kết thúc" type="date" value={toDateInput(couponForm.validTo)} onChange={(e) => setCouponForm({ ...couponForm, validTo: new Date(`${e.target.value}T23:59:59`).toISOString() })} />
            <Field label="Tổng lượt dùng" type="number" min={1} value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Mỗi đơn dùng tối đa 1 mã; không giới hạn theo khách, chỉ giới hạn tổng lượt (GB-21, GB-30).</p>
          {error && <Banner kind="error" className="mt-3">{error}</Banner>}
        </Modal>
      )}
    </div>
  );
};
