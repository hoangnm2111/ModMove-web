/** Các hộp thoại thao tác của khách hàng – gọi API backend thật (customerApi) */
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { TextArea, inputClass } from '../../components/ui/Field';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { customerApi, publicApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_TYPE } from '../../api/labels';
import type { IncidentType, MyIncidentResponse, MyRefundDetailResponse, OrderDetailResponse } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency } from '../../utils/format';

interface BaseProps {
  onClose: () => void;
  onDone: () => void;
}

/** Ô chọn lý do theo master data; chọn OTHER bắt buộc ghi lý do */
const ReasonPicker: React.FC<{ load: () => Promise<{ code: string; name: string }[]>; value: string; onChange: (c: string) => void }> = ({ load, value, onChange }) => {
  const q = useQuery(load, []);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        Lý do <span className="text-rose-500">*</span>
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass()} disabled={q.loading}>
        <option value="">{q.loading ? 'Đang tải…' : '— Chọn lý do —'}</option>
        {(q.data ?? []).map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
      {q.error && <p className="mt-1 text-[11px] text-rose-600">{q.error}</p>}
    </div>
  );
};

/* ------------------------------------------------------------ Huỷ đơn (UC-CUS-29) */
export const CancelOrderModal: React.FC<BaseProps & { order: OrderDetailResponse }> = ({ order, onClose, onDone }) => {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const paid = order.paymentMethod === 'PayOS' && order.paymentStatus === 'Paid';
  const submit = async () => {
    if (!code) return toast.error('Vui lòng chọn lý do huỷ.');
    if (code === 'OTHER' && !reason.trim()) return toast.error('Vui lòng ghi rõ lý do khi chọn "Khác".');
    setBusy(true);
    try {
      await customerApi.cancelOrder(order.id, code, reason.trim());
      toast.success(`Đã huỷ đơn ${order.orderCode}.${paid ? ' Yêu cầu hoàn 100% đã được gửi tới Admin.' : ''}`);
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
      title={`Huỷ đơn ${order.orderCode}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Không huỷ
          </Button>
          <Button variant="danger" size="sm" onClick={submit} isLoading={busy}>
            Xác nhận huỷ
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">
          Huỷ miễn phí khi đơn đang <b>Đang tìm tài xế</b> hoặc <b>Tài xế đã nhận</b> (GB-22).{' '}
          {paid ? `Đơn đã thanh toán PayOS sẽ được hoàn 100% (${formatCurrency(order.totalFee)}) sau khi Admin duyệt.` : ''} Lượt dùng mã giảm giá không được hoàn.
        </Banner>
        <ReasonPicker load={publicApi.cancellationReasons} value={code} onChange={setCode} />
        <TextArea label={code === 'OTHER' ? 'Ghi rõ lý do *' : 'Ghi chú thêm'} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Từ chối ảnh lấy hàng (UC-CUS-12) */
export const RejectPickupModal: React.FC<BaseProps & { order: OrderDetailResponse }> = ({ order, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const count = order.proof?.pickupSubmissionCount ?? 0;
  const submit = async () => {
    if (!reason.trim()) return toast.error('Vui lòng nêu lý do từ chối để tài xế chụp lại.');
    setBusy(true);
    try {
      await customerApi.reviewPickup(order.id, false, reason.trim());
      toast.success('Đã từ chối ảnh. Tài xế sẽ kiểm tra và chụp lại.');
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
      title="Từ chối ảnh lấy hàng"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" size="sm" onClick={submit} isLoading={busy}>
            Gửi từ chối
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="warning">
          Đây là lần gửi ảnh thứ {count}/5. Sau lần từ chối thứ 5, tài xế phải báo sự cố để Dispatcher xử lý (GB-11).
        </Banner>
        <TextArea label="Lý do từ chối *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="VD: Ảnh mờ, thiếu thùng hàng số 2, hàng có vết móp chưa ghi nhận…" />
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Khiếu nại (UC-CUS-21/22) */
export const ComplaintModal: React.FC<BaseProps & { order: OrderDetailResponse }> = ({ order, onClose, onDone }) => {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const isCash = order.paymentMethod === 'Cash';
  const submit = async () => {
    if (!code) return toast.error('Vui lòng chọn lý do khiếu nại.');
    if (code === 'OTHER' && !reason.trim()) return toast.error('Vui lòng mô tả lý do khi chọn "Khác".');
    if (!(amount > 0) || amount > order.totalFee) return toast.error(`Số tiền yêu cầu phải từ 1đ tới ${formatCurrency(order.totalFee)}.`);
    setBusy(true);
    try {
      await customerApi.submitComplaint({ orderId: order.id, reasonCode: code, reason: reason.trim() || null, evidenceUrls: photos, requestedAmount: Math.round(amount) });
      toast.success('Đã gửi khiếu nại. Điều phối viên sẽ xem xét và có thể liên hệ bổ sung thông tin.');
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
      title={`Khiếu nại đơn ${order.orderCode}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Gửi khiếu nại
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">
          Khiếu nại trong vòng 24 giờ sau khi giao (GB-18). Khi khiếu nại đang mở, đơn chưa hoàn tất và tài xế chưa được tất toán.
          {isCash && ' Đơn tiền mặt: tranh chấp tiền được xử lý ngoài hệ thống, nhưng bạn vẫn có thể gửi khiếu nại để ghi nhận.'}
        </Banner>
        <ReasonPicker load={publicApi.complaintReasons} value={code} onChange={setCode} />
        <TextArea label={code === 'OTHER' ? 'Mô tả chi tiết *' : 'Mô tả chi tiết'} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Số tiền yêu cầu hoàn (tối đa {formatCurrency(order.totalFee)}) <span className="text-rose-500">*</span>
          </label>
          <input type="number" min={1} max={order.totalFee} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className={inputClass()} />
        </div>
        <PhotoUploader label="Ảnh bằng chứng" value={photos} onChange={setPhotos} max={5} upload={customerApi.upload} />
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Báo sự cố (UC-CUS-15) */
const INCIDENT_TYPES: IncidentType[] = ['DamagedCargo', 'VehicleBreakdown', 'Accident', 'Other'];
export const ReportIncidentModal: React.FC<BaseProps & { order: OrderDetailResponse }> = ({ order, onClose, onDone }) => {
  const [type, setType] = useState<IncidentType>('Other');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [useGps, setUseGps] = useState(true);
  const [busy, setBusy] = useState(false);
  const getPos = () =>
    new Promise<{ latitude: number; longitude: number } | null>((res) => {
      if (!useGps || !navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(
        (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => res(null),
        { timeout: 5000 }
      );
    });
  const submit = async () => {
    if (!desc.trim()) return toast.error('Vui lòng mô tả sự cố.');
    setBusy(true);
    try {
      const pos = await getPos();
      await customerApi.reportIncident({ orderId: order.id, incidentType: type, description: desc.trim(), photoUrls: photos, latitude: pos?.latitude ?? null, longitude: pos?.longitude ?? null });
      toast.success('Đã gửi báo cáo sự cố. Điều phối viên sẽ xử lý ngay.');
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
      title={`Báo sự cố – ${order.orderCode}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" size="sm" onClick={submit} isLoading={busy}>
            Gửi báo cáo
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">Từ khi tài xế đến điểm lấy, bạn không tự huỷ được đơn. Hãy báo sự cố để Điều phối viên quyết định (tiếp tục, đổi tài xế hoặc huỷ).</Banner>
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-1">Loại sự cố *</span>
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold text-left ${type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {INCIDENT_TYPE[t]}
              </button>
            ))}
          </div>
        </div>
        <TextArea label="Mô tả *" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} />
        <PhotoUploader label="Ảnh minh chứng" value={photos} onChange={setPhotos} max={5} upload={customerApi.upload} />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={useGps} onChange={(e) => setUseGps(e.target.checked)} /> Gửi kèm vị trí hiện tại của tôi
        </label>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Yêu cầu hoàn tiền cho sự cố (UC-CUS-17/18) */
export const IncidentRefundModal: React.FC<BaseProps & { order: OrderDetailResponse; incident: MyIncidentResponse }> = ({ order, incident, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast.error('Vui lòng nêu lý do yêu cầu hoàn tiền.');
    if (!(amount > 0) || amount > order.totalFee) return toast.error(`Số tiền phải từ 1đ tới ${formatCurrency(order.totalFee)}.`);
    setBusy(true);
    try {
      await customerApi.requestIncidentRefund({ incidentId: incident.id, reason: reason.trim(), evidenceUrls: photos, requestedAmount: Math.round(amount) });
      toast.success('Đã gửi yêu cầu hoàn tiền. Điều phối viên sẽ đề xuất, Admin duyệt và chuyển khoản.');
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
      title={`Yêu cầu hoàn tiền – sự cố #${incident.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Gửi yêu cầu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">Chỉ áp dụng cho đơn PayOS đã thanh toán. Số tiền được Điều phối viên đề xuất và Admin duyệt không vượt số bạn yêu cầu (GB-42).</Banner>
        <TextArea label="Lý do *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền yêu cầu (tối đa {formatCurrency(order.totalFee)}) *</label>
          <input type="number" min={1} max={order.totalFee} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className={inputClass()} />
        </div>
        <PhotoUploader label="Ảnh bằng chứng" value={photos} onChange={setPhotos} max={5} upload={customerApi.upload} />
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Trả lời Dispatcher (GB-43) */
export const ReplyInfoModal: React.FC<BaseProps & { refund: MyRefundDetailResponse }> = ({ refund, onClose, onDone }) => {
  const [reply, setReply] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const room = Math.max(0, 5 - refund.evidenceUrls.length);
  const submit = async () => {
    if (!reply.trim()) return toast.error('Vui lòng nhập câu trả lời.');
    setBusy(true);
    try {
      await customerApi.replyRefund(refund.id, reply.trim(), photos);
      toast.success('Đã gửi thông tin bổ sung.');
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
      title="Bổ sung thông tin cho Điều phối viên"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Gửi trả lời
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {refund.infoRequestNote && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
            <div className="font-bold text-amber-800 mb-0.5">Câu hỏi của Điều phối viên</div>
            <div className="text-amber-900">{refund.infoRequestNote}</div>
          </div>
        )}
        <TextArea label="Câu trả lời *" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} />
        {room > 0 ? (
          <PhotoUploader label={`Ảnh bổ sung (còn ${room} ảnh)`} value={photos} onChange={setPhotos} max={room} upload={customerApi.upload} />
        ) : (
          <p className="text-[11px] text-slate-400">Đã đủ 5 ảnh bằng chứng, không thêm ảnh được nữa.</p>
        )}
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ Đánh giá (UC-CUS-25) */
export const RatingModal: React.FC<BaseProps & { orderId: number; orderCode: string; driverName?: string }> = ({ orderId, orderCode, driverName, onClose, onDone }) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await customerApi.rate(orderId, stars, comment.trim());
      toast.success('Cảm ơn bạn đã đánh giá!');
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
      title={`Đánh giá chuyến ${orderCode}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Để sau
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Gửi đánh giá
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-center">
        {driverName && <p className="text-sm text-slate-600">Tài xế: <b>{driverName}</b></p>}
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} sao`}>
              <Star className={`w-8 h-8 ${n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
        <div className="text-left">
          <TextArea label="Nhận xét" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        </div>
        <p className="text-[11px] text-slate-400">Mỗi đơn đánh giá một lần, không sửa được, trong vòng 1 ngày sau khi hoàn thành (GB-20).</p>
      </div>
    </Modal>
  );
};
