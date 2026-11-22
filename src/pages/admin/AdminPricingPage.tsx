import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Card, DataState, PageShell, Pill, Table } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import type { PlatformSettingsResponse, VehicleTypePricingResponse } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency } from '../../utils/format';

const ON = { label: 'Đang dùng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
const OFF = { label: 'Đã tắt', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

/** UC-ADM-10..13 – Bảng cước, phí dịch vụ, hoa hồng (GB-29, GB-33, C8) */
export const AdminPricingPage: React.FC = () => {
  const q = useQuery(() => adminApi.pricing(), []);
  const [edit, setEdit] = useState<VehicleTypePricingResponse | null>(null);
  const [adding, setAdding] = useState(false);
  const toggle = async (v: VehicleTypePricingResponse) => {
    try {
      await adminApi.setVehicleTypeActive(v.id, !v.isActive);
      toast.success(`${v.isActive ? 'Đã tắt' : 'Đã bật'} loại xe ${v.name}.`);
      await q.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <PageShell title="Bảng cước & hoa hồng" subtitle="Giá mới áp dụng cho đơn đặt sau thời điểm thay đổi; đơn đã đặt giữ nguyên giá">
      <div className="w-full space-y-4">
        <DataState q={q}>
          {(p) => (
            <>
              <Card
                title="Giá theo loại xe"
                actions={
                  <Button size="sm" onClick={() => setAdding(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm loại xe
                  </Button>
                }
              >
                <Table
                  rows={p.vehicleTypes}
                  rowKey={(v) => v.id}
                  cols={[
                    { head: 'Loại xe', cell: (v) => <b>{v.name}</b> },
                    { head: 'Tải trọng', cell: (v) => `${v.maxLoadWeightKg.toLocaleString('vi-VN')} kg` },
                    { head: 'Giá mở cửa', className: 'text-right', cell: (v) => formatCurrency(v.baseFare) },
                    { head: 'Giá / km', className: 'text-right', cell: (v) => formatCurrency(v.pricePerKm) },
                    { head: 'Tối thiểu', className: 'text-right', cell: (v) => formatCurrency(v.minimumFare) },
                    { head: 'Ví dụ 10 km', className: 'text-right', cell: (v) => <span className="text-slate-500">{formatCurrency(Math.max(v.minimumFare, v.baseFare + v.pricePerKm * 10))}</span> },
                    { head: 'Trạng thái', cell: (v) => <Pill tone={v.isActive ? ON : OFF} /> },
                    {
                      head: '',
                      className: 'text-right',
                      cell: (v) => (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEdit(v)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa giá
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggle(v)}>
                            {v.isActive ? 'Tắt' : 'Bật'}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
              <SettingsCard s={p.settings} onSaved={q.reload} />
            </>
          )}
        </DataState>
      </div>
      {edit && <FareModal v={edit} onClose={() => setEdit(null)} onDone={() => (setEdit(null), q.reload())} />}
      {adding && <AddVehicleTypeModal onClose={() => setAdding(false)} onDone={() => (setAdding(false), q.reload())} />}
    </PageShell>
  );
};

/** K-30: Admin thêm loại xe – kích thước thùng tính bằng cm (K-35), loại xe mới ở trạng thái bật */
const AddVehicleTypeModal: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const [f, setF] = useState({ name: '', weight: 500, length: 200, width: 150, height: 150, baseFare: 50000, pricePerKm: 10000, minimumFare: 80000 });
  const [busy, setBusy] = useState(false);
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const submit = async () => {
    const name = f.name.trim();
    if (!name || name.length > 50) return toast.error('Tên loại xe bắt buộc, tối đa 50 ký tự.');
    if (!(f.weight > 0)) return toast.error('Tải trọng phải > 0 kg.');
    if ([f.length, f.width, f.height].some((x) => !Number.isInteger(x) || x < 1 || x > 2000)) return toast.error('Kích thước thùng là số nguyên từ 1 đến 2000 cm.');
    if (!(f.pricePerKm > 0) || f.baseFare < 0 || f.minimumFare < 0) return toast.error('Giá mỗi km phải > 0; giá mở cửa và giá tối thiểu không được âm.');
    setBusy(true);
    try {
      await adminApi.createVehicleType({
        name,
        maxLoadWeightKg: f.weight,
        cargoBedLengthCm: f.length,
        cargoBedWidthCm: f.width,
        cargoBedHeightCm: f.height,
        baseFare: f.baseFare,
        pricePerKm: f.pricePerKm,
        minimumFare: f.minimumFare,
      });
      toast.success(`Đã thêm loại xe ${name}.`);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title="Thêm loại xe"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Thêm
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Tên loại xe" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="VD: Xe tải 1,5 tấn" />
        <Field label="Tải trọng tối đa kg" type="number" required value={f.weight} onChange={num('weight')} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dài thùng cm" type="number" required value={f.length} onChange={num('length')} />
          <Field label="Rộng thùng cm" type="number" required value={f.width} onChange={num('width')} />
          <Field label="Cao thùng cm" type="number" required value={f.height} onChange={num('height')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Giá mở cửa VND" type="number" value={f.baseFare} onChange={num('baseFare')} />
          <Field label="Giá mỗi km VND" type="number" required value={f.pricePerKm} onChange={num('pricePerKm')} />
          <Field label="Giá tối thiểu VND" type="number" value={f.minimumFare} onChange={num('minimumFare')} />
        </div>
      </div>
    </Modal>
  );
};

const SettingsCard: React.FC<{ s: PlatformSettingsResponse; onSaved: () => Promise<void> }> = ({ s, onSaved }) => {
  const [f, setF] = useState({ commission: s.commissionRate * 100, loadingFee: s.loadingFee, minCod: s.requiredDeposit, radius: s.matchingRadiusKm });
  const [busy, setBusy] = useState(false);
  useEffect(() => setF({ commission: s.commissionRate * 100, loadingFee: s.loadingFee, minCod: s.requiredDeposit, radius: s.matchingRadiusKm }), [s]);
  const save = async () => {
    const patch: Partial<PlatformSettingsResponse> = {};
    const rate = Math.round(f.commission * 100) / 10000;
    if (rate !== s.commissionRate) patch.commissionRate = rate;
    if (f.loadingFee !== s.loadingFee) patch.loadingFee = f.loadingFee;
    if (f.minCod !== s.requiredDeposit) patch.requiredDeposit = f.minCod;
    if (f.radius !== s.matchingRadiusKm) patch.matchingRadiusKm = f.radius;
    if (Object.keys(patch).length === 0) return toast.info('Chưa có thay đổi.');
    if (rate < 0 || rate >= 1) return toast.error('Tỷ lệ hoa hồng phải từ 0% đến dưới 100%.');
    setBusy(true);
    try {
      await adminApi.updateSettings(patch);
      toast.success('Đã lưu tham số nền tảng.');
      await onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card
      title="Tham số nền tảng"
      actions={
        <Button size="sm" onClick={save} isLoading={busy}>
          <Save className="w-4 h-4 mr-1" /> Lưu thay đổi
        </Button>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Hoa hồng nền tảng %" type="number" step="0.1" value={f.commission} onChange={(e) => setF({ ...f, commission: Number(e.target.value) })} />
        <Field label="Phí bốc xếp VND" type="number" value={f.loadingFee} onChange={(e) => setF({ ...f, loadingFee: Number(e.target.value) })} />
        <Field label="Tiền cọc tối thiểu để nhận đơn VND" type="number" value={f.minCod} onChange={(e) => setF({ ...f, minCod: Number(e.target.value) })} />
        <Field label="Bán kính ghép đơn km" type="number" step="0.5" value={f.radius} onChange={(e) => setF({ ...f, radius: Number(e.target.value) })} />
      </div>
    </Card>
  );
};

const FareModal: React.FC<{ v: VehicleTypePricingResponse; onClose: () => void; onDone: () => void }> = ({ v, onClose, onDone }) => {
  const [f, setF] = useState({ baseFare: v.baseFare, pricePerKm: v.pricePerKm, minimumFare: v.minimumFare });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (f.baseFare < 0 || f.pricePerKm < 0 || f.minimumFare < 0) return toast.error('Giá không được âm.');
    setBusy(true);
    try {
      await adminApi.updateFares(v.id, f.baseFare, f.pricePerKm, f.minimumFare);
      toast.success(`Đã cập nhật giá ${v.name}.`);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`Sửa giá – ${v.name}`}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Giá mở cửa VND" type="number" value={f.baseFare} onChange={(e) => setF({ ...f, baseFare: Number(e.target.value) })} />
        <Field label="Giá mỗi km VND" type="number" value={f.pricePerKm} onChange={(e) => setF({ ...f, pricePerKm: Number(e.target.value) })} />
        <Field label="Giá tối thiểu VND" type="number" value={f.minimumFare} onChange={(e) => setF({ ...f, minimumFare: Number(e.target.value) })} />
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-0.5">
          {[3, 10, 25].map((km) => (
            <div key={km} className="flex justify-between">
              <span>{km} km</span>
              <b>{formatCurrency(Math.max(f.minimumFare, f.baseFare + f.pricePerKm * km))}</b>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
