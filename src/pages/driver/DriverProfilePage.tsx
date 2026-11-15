import React, { useEffect, useState } from 'react';
import { ImageOff, Loader2, Send, Trash2, Upload } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Field, inputClass } from '../../components/ui/Field';
import { Card, KV, Loading, PageShell, Pill } from '../../components/ui/kit';
import { driverApi, publicApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { APPROVAL_STATUS } from '../../api/labels';
import { useDriver } from '../../features/driver/DriverContext';
import { useAuthStore } from '../../store/useAuthStore';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime } from '../../utils/format';

/** Đúng 7 ảnh theo thứ tự BE (DECISIONS D2, 2026-11-12): CCCD ở cuối để hồ sơ 5 ảnh cũ giữ nguyên vị trí. */
export const DRIVER_DOCS = ['Bằng lái – mặt trước', 'Bằng lái – mặt sau', 'Đăng ký xe', 'Giấy đăng kiểm', 'Ảnh xe', 'CCCD – mặt trước', 'CCCD – mặt sau'];
const DOCS = DRIVER_DOCS;
const isUrl = (u: string) => /^https?:\/\/\S{4,}$/i.test(u) && u.length <= 500;
const MAX_BYTES = 5 * 1024 * 1024;

/** UC-DRV-03/04/05/06 – Hồ sơ tài xế & phương tiện: GET/POST /driver/Onboarding */
export const DriverProfilePage: React.FC = () => {
  const { onboarding: ob, reload } = useDriver();
  const user = useAuthStore((s) => s.user);
  const vehicles = useQuery(() => publicApi.vehicleTypes(), []);
  const [f, setF] = useState({ vehicleTypeId: 0, citizenId: '', license: '', plate: '', maxLoad: 0, docs: DOCS.map(() => '') });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  /** Ảnh giấy tờ phải là ảnh Cloudinary của hệ thống (BE chặn URL lạ): tải qua POST /driver/Uploads */
  const pick = async (i: number, file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) return toast.error('Chỉ nhận ảnh JPG hoặc PNG.');
    if (file.size > MAX_BYTES) return toast.error('Ảnh tối đa 5 MB.');
    setUploading(i);
    try {
      const { url } = await driverApi.upload(file);
      setF((prev) => ({ ...prev, docs: prev.docs.map((d, k) => (k === i ? url : d)) }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(null);
    }
  };

  /** Q12: xoá (vô hiệu hoá) tài khoản tài xế; BE chặn khi còn đơn chạy, rút tiền chờ, hoặc ví khác 0 */
  const deleteAccount = async () => {
    const ok = await confirm({
      title: 'Xoá tài khoản tài xế?',
      message: 'Tài khoản chuyển sang vô hiệu hoá, bạn bị đăng xuất khỏi mọi thiết bị. Hồ sơ, xe, ví và lịch sử vẫn được giữ; quản trị viên có thể mở lại.',
      confirmText: 'Xoá tài khoản',
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await driverApi.deleteAccount();
      toast.info('Tài khoản tài xế đã được vô hiệu hoá.');
      logout();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!ob) return;
    setF({
      vehicleTypeId: ob.vehicleTypeId ?? 0,
      citizenId: ob.citizenIdNumber ?? '',
      license: ob.driverLicenseNumber ?? '',
      plate: ob.licensePlate ?? '',
      maxLoad: ob.maxLoadWeightKg ?? 0,
      docs: DOCS.map((_, i) => ob.documentUrls[i] ?? ''),
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
    if (bad >= 0) return toast.error(`Thiếu ảnh “${DOCS[bad]}”.`);
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
      toast.success('Đã nộp hồ sơ. Quản trị viên sẽ thẩm định và thông báo kết quả.');
      await reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const vehicle = (vehicles.data ?? []).find((v) => v.id === f.vehicleTypeId);
  const st = ob.profileApprovalStatus;

  return (
    <PageShell title="Hồ sơ & phương tiện" subtitle="Nộp giấy tờ để được duyệt và bắt đầu nhận đơn">
      <div className="w-full space-y-4">
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
              <div className="text-xs font-bold text-slate-700 mb-1">Giấy tờ & ảnh xe (đủ 7 ảnh)</div>
              <p className="text-[11px] text-slate-500 mb-2">Mỗi ảnh JPG/PNG tối đa 5 MB, chụp rõ nét và đủ 4 góc.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                {DOCS.map((label, i) => (
                  <div key={label} className="space-y-1.5">
                    <div className="aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {uploading === i ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : isUrl(f.docs[i]) ? (
                        <img src={f.docs[i]} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700">{label} *</div>
                    {ob.canSubmit && (
                      <label className="flex items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> {f.docs[i] ? 'Đổi ảnh' : 'Tải ảnh'}
                        <input type="file" accept="image/jpeg,image/png" className="hidden" disabled={uploading !== null} onChange={(e) => { void pick(i, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </fieldset>
        </Card>

        <Card title="Xoá tài khoản">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs text-slate-600 flex-1">
              Chỉ xoá được khi không có đơn đang chạy, không có yêu cầu rút tiền đang chờ và ví bằng 0 (rút hết tiền, hoặc nạp đủ nếu tiền cọc âm).
            </p>
            <Button size="sm" variant="danger" onClick={deleteAccount} isLoading={deleting}>
              <Trash2 className="w-4 h-4 mr-1" /> Xoá tài khoản
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};
