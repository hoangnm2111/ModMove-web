import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { msg } from '../../constants/messages';
import { calculateFare } from '../../domain/pricing';
import { useAdminVehicleTypes, usePlatformSettings } from '../../hooks/useDomainData';
import { catalogService } from '../../services/catalog.service';
import { errorMessage } from '../../services/mock/storage';
import { VehicleType } from '../../types/order.types';
import { formatCurrency } from '../../utils/format';

type FareRow = Pick<VehicleType, 'id' | 'name' | 'baseFare' | 'pricePerKm' | 'minimumFare' | 'isActive'>;

/** SCR-35 – Cấu hình giá cước & hoa hồng (GB-29, GB-33) */
export const AdminPricingPage: React.FC = () => {
  const vehicles = useAdminVehicleTypes();
  const settings = usePlatformSettings();
  const [rows, setRows] = useState<FareRow[]>([]);
  const [commissionPct, setCommissionPct] = useState(settings.commissionRate * 100);
  const [loadingFee, setLoadingFee] = useState(settings.loadingFee);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setRows(vehicles.map(({ id, name, baseFare, pricePerKm, minimumFare, isActive }) => ({ id, name, baseFare, pricePerKm, minimumFare, isActive }))), [vehicles]);
  useEffect(() => {
    setCommissionPct(Math.round(settings.commissionRate * 1000) / 10);
    setLoadingFee(settings.loadingFee);
  }, [settings]);

  const edit = (id: string, key: 'baseFare' | 'pricePerKm' | 'minimumFare', value: number) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const save = async () => {
    if (!(await confirm({ title: 'Lưu cấu hình giá', message: `${msg('MSG62', { action_name: 'cập nhật bảng giá và hoa hồng' })} Giá mới áp dụng cho đơn gửi sau thời điểm này; hoa hồng mới áp dụng cho đơn được nhận sau thời điểm này (GB-33).` }))) return;
    setSaving(true);
    setError(null);
    try {
      for (const r of rows) {
        await catalogService.updateVehicleTypeFares(r.id, { baseFare: r.baseFare, pricePerKm: r.pricePerKm, minimumFare: r.minimumFare });
      }
      await catalogService.saveSettings({ commissionRate: commissionPct / 100, loadingFee });
      toast.success(msg('MSG04', { record_name: 'bảng giá' }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 min-w-0">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <header className="flex items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-lg font-black text-slate-900">Cấu hình giá cước & hoa hồng</h1>
            <p className="text-xs text-slate-500">Cước = max(Tối thiểu, Mở cửa + Giá/km × km) + Bốc xếp − Giảm giá. Không phụ phí giờ cao điểm (GB-29).</p>
          </div>
          <Button size="sm" onClick={save} isLoading={saving}>
            <Save className="w-4 h-4 mr-1.5" /> Lưu cấu hình
          </Button>
        </header>

        {error && <Banner kind="error">{error}</Banner>}

        <section className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="p-3">Loại xe</th>
                <th className="p-3">Giá mở cửa</th>
                <th className="p-3">Giá / km</th>
                <th className="p-3">Cước tối thiểu</th>
                <th className="p-3">Ví dụ 10 km</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 font-bold text-slate-800">
                    {r.name} {!r.isActive && <span className="text-[10px] text-slate-400">(ngừng hoạt động)</span>}
                  </td>
                  {(['baseFare', 'pricePerKm', 'minimumFare'] as const).map((k) => (
                    <td key={k} className="p-2">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        aria-label={`${r.name} ${k}`}
                        value={r[k]}
                        onChange={(e) => edit(r.id, k, Number(e.target.value))}
                        className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 font-semibold"
                      />
                    </td>
                  ))}
                  <td className="p-3 font-black text-slate-900">{formatCurrency(calculateFare({ vehicle: r, distanceKm: 10, durationMins: 25, loadingService: false, loadingFee }).total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <Field label="Tỷ lệ hoa hồng nền tảng (%) – UC-ADM-13" type="number" min={0} max={50} step={0.5} value={commissionPct} onChange={(e) => setCommissionPct(Number(e.target.value))} />
            <p className="text-[11px] text-slate-500">Hoa hồng = tỷ lệ × cước sau giảm giá, chốt khi tài xế nhận đơn (GB-14). Mặc định 10%.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <Field label="Phí dịch vụ bốc xếp (đ) – UC-ADM-12" type="number" min={0} step={5000} value={loadingFee} onChange={(e) => setLoadingFee(Number(e.target.value))} />
            <p className="text-[11px] text-slate-500">Áp dụng khi khách chọn bốc xếp 2 đầu.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
