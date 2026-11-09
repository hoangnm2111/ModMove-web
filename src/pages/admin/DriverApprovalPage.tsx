import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { inputClass } from '../../components/ui/Field';
import { Card, DataState, Empty, KV, PageShell, Pager, Pill, cx } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { APPROVAL_STATUS } from '../../api/labels';
import type { DriverApplicationDetailsResponse } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime, timeAgo } from '../../utils/format';

/** Thứ tự cố định của documentUrls (DECISIONS D10) */
const DOCS = ['Bằng lái – mặt trước', 'Bằng lái – mặt sau', 'Đăng ký xe', 'Giấy đăng kiểm', 'Ảnh xe'];
const CHECK_ITEMS = ['Số CCCD', 'Số giấy phép lái xe', 'Biển số xe', 'Tải trọng khai báo', ...DOCS];

/** UC-ADM-08/09 – Thẩm định hồ sơ tài xế */
export const DriverApprovalPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<number | null>(null);
  const list = useQuery(() => adminApi.pendingApplications(page, 20), [page], { refreshMs: 60_000 });
  const items = list.data?.items ?? [];
  const current = sel ?? items[0]?.applicationId ?? null;

  return (
    <PageShell title="Thẩm định hồ sơ tài xế" subtitle="Hồ sơ nộp trước được duyệt trước • mỗi lần nộp lại là một phiên bản mới">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-4">
        <Card title={`Chờ duyệt (${list.data?.totalCount ?? 0})`} padded={false}>
          <DataState q={list} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <ul className="divide-y divide-slate-100">
                  {d.items.map((a) => (
                    <li key={a.applicationId}>
                      <button onClick={() => setSel(a.applicationId)} className={cx('w-full text-left px-4 py-3 text-xs', current === a.applicationId ? 'bg-blue-50' : 'hover:bg-slate-50')}>
                        <div className="flex items-center gap-2">
                          <b className="text-sm text-slate-900">{a.fullName}</b>
                          {a.versionNumber > 1 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Nộp lại v{a.versionNumber}</span>}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {a.phoneNumber} • <span className="font-mono">{a.licensePlate}</span> • {a.vehicleTypeName}
                        </div>
                        <div className="text-slate-400">Nộp {timeAgo(a.submittedAt)}</div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 pb-3">
                  <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
                </div>
              </>
            )}
          </DataState>
        </Card>
        <div className="lg:col-span-2">
          {current ? (
            <ApplicationDetail key={current} id={current} onDone={() => (setSel(null), list.reload())} />
          ) : (
            !list.loading && <Empty text="Không có hồ sơ nào đang chờ duyệt." />
          )}
        </div>
      </div>
    </PageShell>
  );
};

const ApplicationDetail: React.FC<{ id: number; onDone: () => void }> = ({ id, onDone }) => {
  const q = useQuery(() => adminApi.application(id), [id]);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const approve = async (a: DriverApplicationDetailsResponse) => {
    if (!(await confirm({ title: 'Duyệt hồ sơ', message: `Duyệt tài xế ${a.fullName} (${a.licensePlate})? Tài xế sẽ được bật Online và ví tài xế được tạo.` }))) return;
    setBusy(true);
    try {
      await adminApi.approveApplication(a.applicationId);
      toast.success('Đã duyệt hồ sơ. Tài xế đã được thông báo.');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <DataState q={q}>
      {(a) => (
        <div className="space-y-4">
          <Card
            title={
              <>
                {a.fullName} – phiên bản v{a.versionNumber} <Pill tone={APPROVAL_STATUS[a.applicationStatus]} />
              </>
            }
            actions={
              a.applicationStatus === 'Pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => setRejecting(true)}>
                    <XCircle className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                  <Button size="sm" onClick={() => approve(a)} isLoading={busy}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                </div>
              )
            }
          >
            <div className="grid sm:grid-cols-2 gap-x-6">
              <div>
                <KV label="Email">{a.email}</KV>
                <KV label="Số điện thoại">{a.phoneNumber}</KV>
                <KV label="Số CCCD">{a.citizenIdNumber}</KV>
                <KV label="Số GPLX">{a.driverLicenseNumber}</KV>
              </div>
              <div>
                <KV label="Loại xe">{a.vehicleTypeName}</KV>
                <KV label="Biển số">
                  <span className="font-mono">{a.licensePlate}</span>
                </KV>
                <KV label="Tải trọng khai báo">{a.maxLoadWeightKg} kg</KV>
                <KV label="Nộp lúc">{formatDateTime(a.submittedAt)}</KV>
              </div>
            </div>
          </Card>
          <Card title="Giấy tờ & ảnh xe">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {DOCS.map((label, i) => {
                const url = a.documentUrls[i];
                return (
                  <div key={label} className="text-center">
                    <button
                      type="button"
                      disabled={!url}
                      onClick={() => url && setZoom(url)}
                      className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:ring-2 ring-blue-500 disabled:hover:ring-0"
                    >
                      {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : <span className="text-[10px] text-rose-500">Thiếu</span>}
                    </button>
                    <div className="text-[11px] font-bold text-slate-600 mt-1">{label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          {a.history.length > 1 && (
            <Card title="Lịch sử các lần nộp">
              <ul className="space-y-2 text-xs">
                {a.history.map((h) => (
                  <li key={h.applicationId} className="border border-slate-200 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <b>v{h.versionNumber}</b> <Pill tone={APPROVAL_STATUS[h.applicationStatus]} />
                      <span className="text-slate-400">
                        Nộp {formatDateTime(h.submittedAt)}
                        {h.reviewedAt ? ` • Xét ${formatDateTime(h.reviewedAt)}` : ''}
                      </span>
                    </div>
                    {h.rejectionReasons && h.rejectionReasons.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 text-rose-700">
                        {h.rejectionReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {rejecting && <RejectModal app={a} onClose={() => setRejecting(false)} onDone={onDone} />}
          {zoom && (
            <div className="fixed inset-0 z-[150] bg-slate-950/80 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
              <img src={zoom} alt="Giấy tờ" className="max-w-full max-h-[85vh] rounded-xl" />
            </div>
          )}
        </div>
      )}
    </DataState>
  );
};

const RejectModal: React.FC<{ app: DriverApplicationDetailsResponse; onClose: () => void; onDone: () => void }> = ({ app, onClose, onDone }) => {
  const [items, setItems] = useState<Record<string, string>>({});
  const [other, setOther] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (k: string) => setItems((s) => (k in s ? Object.fromEntries(Object.entries(s).filter(([x]) => x !== k)) : { ...s, [k]: '' }));
  const submit = async () => {
    const reasons = [...Object.entries(items).map(([k, v]) => `${k}: ${v.trim() || 'không hợp lệ, cần bổ sung'}`), ...(other.trim() ? [other.trim()] : [])];
    if (reasons.length === 0) return toast.error('Chọn ít nhất một mục cần sửa hoặc ghi lý do khác.');
    setBusy(true);
    try {
      await adminApi.rejectApplication(app.applicationId, reasons);
      toast.success('Đã từ chối hồ sơ. Tài xế sẽ nhận danh sách mục cần sửa.');
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
      size="lg"
      title={`Từ chối hồ sơ ${app.fullName}`}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" variant="danger" onClick={submit} isLoading={busy}>
            Gửi từ chối
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">Chọn từng mục cần tài xế sửa và ghi lý do cụ thể (UC-ADM-09). Tài xế nộp lại sẽ tạo phiên bản mới.</Banner>
        <ul className="space-y-2">
          {CHECK_ITEMS.map((k) => (
            <li key={k} className="text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={k in items} onChange={() => toggle(k)} /> {k}
              </label>
              {k in items && <input className={`${inputClass()} mt-1`} placeholder="Lý do (VD: ảnh mờ, hết hạn, không khớp…)" value={items[k]} onChange={(e) => setItems({ ...items, [k]: e.target.value })} />}
            </li>
          ))}
        </ul>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Lý do khác</label>
          <input className={inputClass()} value={other} onChange={(e) => setOther(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};
