import React, { useEffect, useState } from 'react';
import { ImageOff, Send } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Field, inputClass } from '../../components/ui/Field';
import { Card, KV, Loading, PageShell, PhotoGrid, Pill } from '../../components/ui/kit';
import { driverApi, publicApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { APPROVAL_STATUS } from '../../api/labels';
import { useDriver } from '../../features/driver/DriverContext';
import { useAuthStore } from '../../store/useAuthStore';
import { notify, notifyError } from '../../notifications/store';
import { formatDateTime } from '../../utils/format';

const DOCS = ['Bằng lái – mặt trước', 'Bằng lái – mặt sau', 'Đăng ký xe', 'Giấy đăng kiểm', 'Ảnh xe'];
const isUrl = (u: string) => /^https?:\/\/\S{4,}$/i.test(u) && u.length <= 500;

/** UC-DRV-03/04/05/06 – Hồ sơ tài xế & phương tiện: GET/POST /driver/Onboarding */
export const DriverProfilePage: React.FC = () => {
  const { onboarding: ob, reload } = useDriver();
  const user = useAuthStore((s) => s.user);
  const vehicles = useQuery(() => publicApi.vehicleTypes(), []);
  const [f, setF] = useState({ vehicleTypeId: 0, citizenId: '', license: '', plate: '', maxLoad: 0, docs: ['', '', '', '', ''] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ob) return;
    setF({
      vehicleTypeId: ob.vehicleTypeId ?? 0,
      citizenId: ob.citizenIdNumber ?? '',
      license: ob.driverLicenseNumber ?? '',
      plate: ob.licensePlate ?? '',
      maxLoad: ob.maxLoadWeightKg ?? 0,
      docs: [0, 1, 2, 3, 4].map((i) => ob.documentUrls[i] ?? ''),
    });
  }, [ob]);

  if (!ob)
    return (
      <PageShell title="Hồ sơ & phương tiện">
        <Loading />
      </PageShell>
    );

  const submit = async () => {
    if (!f.vehicleTypeId) return toast.error('Chọn loại xe.');
    if (!/^[0-9]{9,12}$/.test(f.citizenId)) return toast.error('Số CCCD gồm 9–12 chữ số.');
    if (!/^[0-9A-Za-z]{8,20}$/.test(f.license)) return toast.error('Số GPLX gồm 8–20 chữ/số.');
    if (!/^[0-9A-Za-z.\- ]{5,15}$/.test(f.plate)) return toast.error('Biển số không hợp lệ (5–15 ký tự).');
    if (!(f.maxLoad > 0)) return toast.error('Nhập tải trọng tối đa của xe.');
    const bad = f.docs.findIndex((d) => !isUrl(d.trim()));
    if (bad >= 0) return toast.error(`“${DOCS[bad]}”: cần đường dẫn ảnh http(s) hợp lệ.`);
    setBusy(true);
    try {
      await driverApi.submitOnboarding({
        vehicleTypeId: f.vehicleTypeId,
        citizenIdNumber: f.citizenId,
        driverLicenseNumber: f.license,
        licensePlate: f.plate.toUpperCase(),
        maxLoadWeightKg: f.maxLoad,
        documentUrls: f.docs.map((d) => d.trim()),
      });
      notify('DRIVER_APPLICATION_SUBMITTED');
      await reload();
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  };

  const vehicle = (vehicles.data ?? []).find((v) => v.id === f.vehicleTypeId);
  const st = ob.profileApprovalStatus;

  return (
    <PageShell title="Hồ sơ & phương tiện" subtitle="Nộp giấy tờ để được duyệt và bắt đầu nhận đơn">
      <div className="max-w-5xl mx-auto space-y-4">
        <Card title="Trạng thái hồ sơ" actions={st ? <Pill tone={APPROVAL_STATUS[st]} /> : <Pill tone={{ label: 'Chưa nộp', cls: 'bg-slate-100 text-slate-600 border-slate-200' }} />}>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <div>
              <KV label="Họ tên">{user?.fullName}</KV>
              <KV label="Email">{user?.email}</KV>
              <KV label="Số điện thoại">{user?.phoneNumber}</KV>
            </div>
            <div>
              <KV label="Phiên bản mới nhất">{ob.latestVersionNumber ? `v${ob.latestVersionNumber}` : '—'}</KV>
              <KV label="Nộp lúc">{ob.submittedAt ? formatDateTime(ob.submittedAt) : '—'}</KV>
              <KV label="Xét duyệt lúc">{ob.reviewedAt ? formatDateTime(ob.reviewedAt) : '—'}</KV>
            </div>
          </div>
          {st === 'Pending' && <Banner kind="info" className="mt-3">Hồ sơ đang chờ thẩm định – không chỉnh sửa được trong lúc chờ (MSG07).</Banner>}
          {st === 'Approved' && <Banner kind="success" className="mt-3">Hồ sơ đã được duyệt. Bạn có thể bật nhận đơn.</Banner>}
          {st === 'Rejected' && ob.rejectionReasons && (
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <b>Hồ sơ bị từ chối – cần sửa:</b>
              <ul className="list-disc ml-5 mt-1">
                {ob.rejectionReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <p className="mt-1">Sửa các mục trên rồi nộp lại – hệ thống tạo phiên bản mới.</p>
            </div>
          )}
        </Card>

        <Card
          title={ob.canSubmit ? (ob.hasApplication ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ tài xế') : 'Thông tin đã nộp'}
          actions={
            ob.canSubmit && (
              <Button size="sm" onClick={submit} isLoading={busy}>
                <Send className="w-4 h-4 mr-1" /> Nộp hồ sơ
              </Button>
            )
          }
        >
          <fieldset disabled={!ob.canSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại xe *</label>
                <select className={inputClass()} value={f.vehicleTypeId} onChange={(e) => setF({ ...f, vehicleTypeId: Number(e.target.value) })}>
                  <option value={0}>— Chọn loại xe —</option>
                  {(vehicles.data ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (≤ {v.maxLoadWeightKg} kg)
                    </option>
                  ))}
                </select>
                {vehicle && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Thùng {vehicle.cargoBedLengthCm}×{vehicle.cargoBedWidthCm}×{vehicle.cargoBedHeightCm} cm
                  </p>
                )}
              </div>
              <Field label="Biển số xe" required value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value.toUpperCase() })} placeholder="29C-874.12" />
              <Field label="Tải trọng tối đa (kg)" type="number" required value={f.maxLoad || ''} onChange={(e) => setF({ ...f, maxLoad: Number(e.target.value) })} />
              <Field label="Số CCCD" required value={f.citizenId} onChange={(e) => setF({ ...f, citizenId: e.target.value.replace(/\D/g, '') })} hint="9–12 chữ số" />
              <Field label="Số giấy phép lái xe" required value={f.license} onChange={(e) => setF({ ...f, license: e.target.value })} hint="8–20 chữ/số" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">Giấy tờ & ảnh xe (đúng 5 ảnh, theo thứ tự)</div>
              <p className="text-[11px] text-slate-500 mb-2">
                Backend chưa có API tải ảnh cho tài xế trên web, nên tải ảnh từ máy được thực hiện trên app tài xế. Trên web, hãy dán đường dẫn ảnh (https) đã lưu sẵn. Mỗi ảnh JPG/PNG ≤ 5 MB.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {DOCS.map((label, i) => (
                  <div key={label} className="space-y-1.5">
                    <div className="aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {isUrl(f.docs[i]) ? <img src={f.docs[i]} alt={label} className="w-full h-full object-cover" /> : <ImageOff className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700">{label} *</div>
                    <input
                      className={inputClass(!!f.docs[i] && !isUrl(f.docs[i]))}
                      placeholder="https://…"
                      value={f.docs[i]}
                      onChange={(e) => setF({ ...f, docs: f.docs.map((d, k) => (k === i ? e.target.value : d)) })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </fieldset>
          {!ob.canSubmit && ob.documentUrls.length > 0 && (
            <div className="mt-4">
              <PhotoGrid urls={ob.documentUrls} />
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
};
