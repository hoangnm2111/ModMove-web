import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Banner, toast } from '../../components/ui/feedback';
import { Field, TextArea } from '../../components/ui/Field';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { Button } from '../../components/Button';
import { BUSINESS } from '../../config/business';
import { INCIDENT_TYPE_LABEL } from '../../constants';
import { msg } from '../../constants/messages';
import { isRefundable, refundOnCancel } from '../../domain/orderRules';
import { useCancellationReasons, useComplaintReasons } from '../../hooks/useDomainData';
import { caseService } from '../../services/case.service';
import { customerUploadService } from '../../services/customer-upload.service';
import { orderService } from '../../services/order.service';
import { errorMessage } from '../../services/mock/storage';
import { IncidentType, Refund } from '../../types/case.types';
import { ShippingOrder } from '../../types/order.types';
import { formatCurrency } from '../../utils/format';

interface BaseProps {
  order: ShippingOrder;
  onClose: () => void;
}

function useSubmit(onClose: () => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (fn: () => Promise<unknown>, success: string) => {
    setPending(true);
    setError(null);
    try {
      await fn();
      toast.success(success);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return { pending, error, submit };
}

/* --------------------------------------------- UC-CUS-29 Huỷ đơn (MSG36) */
export const CancelOrderModal: React.FC<BaseProps & { customerId: string }> = ({ order, customerId, onClose }) => {
  const reasons = useCancellationReasons();
  const [reasonCode, setReasonCode] = useState('');
  const [reason, setReason] = useState('');
  const { pending, error, submit } = useSubmit(onClose);
  const refund = refundOnCancel(order);
  const code = reasonCode || reasons[0]?.code || 'OTHER';
  const isOther = code.toUpperCase() === 'OTHER';
  return (
    <Modal
      open
      title={`Huỷ đơn ${order.code}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Giữ đơn
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={pending}
            disabled={isOther && !reason.trim()}
            onClick={() => submit(() => orderService.cancelByCustomer(order.id, customerId, code, reason), msg('MSG37', { order_id: order.code }))}
          >
            Xác nhận huỷ
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p>{msg('MSG36', { order_id: order.code })}</p>
        {refund > 0 && <Banner kind="info">Bạn sẽ được hoàn {formatCurrency(refund)} sau khi quản trị viên duyệt.</Banner>}
        {reasons.length > 0 && (
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1">Lý do huỷ</span>
            <select value={code} onChange={(e) => setReasonCode(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-300">
              {reasons.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <TextArea label="Chi tiết" required={isOther} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isOther ? 'Bắt buộc với lý do "Khác"' : 'Không bắt buộc'} />
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};

/* -------------------------------------- UC-CUS-21/22 Khiếu nại (GB-18/42) */
export const ComplaintModal: React.FC<BaseProps> = ({ order, onClose }) => {
  const refundable = isRefundable(order);
  const reasons = useComplaintReasons();
  const [reasonCode, setReasonCode] = useState('');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [amount, setAmount] = useState(refundable ? order.fare.total : 0);
  const { pending, error, submit } = useSubmit(onClose);
  const code = reasonCode || reasons[0]?.code || 'OTHER';
  const isOther = code.toUpperCase() === 'OTHER';
  return (
    <Modal
      open
      title={`Khiếu nại đơn ${order.code}`}
      onClose={onClose}
      footer={
        <Button
          size="sm"
          isLoading={pending}
          disabled={isOther && !reason.trim()}
          onClick={() => submit(() => caseService.submitComplaint(order, { reasonCode: code, reason, evidence: photos, requestedAmount: amount }), 'Đã gửi khiếu nại. Điều phối viên sẽ xem xét.')}
        >
          Gửi khiếu nại
        </Button>
      }
    >
      <div className="space-y-3">
        <Banner kind="info">Chỉ được khiếu nại trong {BUSINESS.COMPLAINT_WINDOW_HOURS} giờ sau khi giao và trước khi xác nhận đã nhận hàng.</Banner>
        {reasons.length > 0 && (
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1">Lý do khiếu nại</span>
            <select value={code} onChange={(e) => setReasonCode(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-300">
              {reasons.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <TextArea label="Nội dung khiếu nại" required={isOther} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mô tả vấn đề về dịch vụ / hàng hoá" />
        <PhotoUploader label="Ảnh minh chứng *" value={photos} onChange={setPhotos} max={BUSINESS.MAX_EVIDENCE_PHOTOS} upload={customerUploadService.uploadImage} />
        {refundable ? (
          <Field
            label={`Số tiền yêu cầu hoàn (tối đa ${formatCurrency(order.fare.total)})`}
            type="number"
            min={0}
            max={order.fare.total}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        ) : (
          <Banner kind="warning">Đơn tiền mặt không hoàn tiền trong hệ thống; khiếu nại được giải quyết ngoài hệ thống.</Banner>
        )}
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};

/* --------------------------------------- UC-DIS-14 / GB-43 Bổ sung thông tin */
export const ReplyInfoModal: React.FC<{ refund: Refund; onClose: () => void }> = ({ refund, onClose }) => {
  const [answer, setAnswer] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const { pending, error, submit } = useSubmit(onClose);
  return (
    <Modal
      open
      title={`Bổ sung thông tin – ${refund.id}`}
      onClose={onClose}
      footer={
        <Button size="sm" isLoading={pending} onClick={() => submit(() => caseService.replyMoreInfo(refund.id, answer, photos), 'Đã gửi thông tin bổ sung.')}>
          Gửi phản hồi
        </Button>
      }
    >
      <div className="space-y-3">
        <Banner kind="warning">{msg('MSG60', { case_type: 'Yêu cầu', case_id: refund.id, requested_information: refund.infoRequest ?? '' })}</Banner>
        <TextArea label="Câu trả lời" required value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <PhotoUploader label="Ảnh bổ sung" value={photos} onChange={setPhotos} max={Math.max(0, BUSINESS.MAX_EVIDENCE_PHOTOS - refund.evidence.length)} upload={customerUploadService.uploadImage} />
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};

/* -------------------------------------------- UC-CUS-25 Đánh giá (GB-20) */
const RATING_TAGS = ['Đúng giờ', 'Bốc xếp cẩn thận', 'Thân thiện', 'Xe sạch sẽ', 'Hỗ trợ nhiệt tình'];

export const RatingModal: React.FC<BaseProps> = ({ order, onClose }) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { pending, error, submit } = useSubmit(onClose);
  return (
    <Modal
      open
      title={`Đánh giá chuyến ${order.code}`}
      onClose={onClose}
      size="sm"
      footer={
        <Button size="sm" isLoading={pending} disabled={stars === 0} onClick={() => submit(() => orderService.rateOrder(order.id, { stars, comment, tags }), msg('MSG57'))}>
          Gửi đánh giá
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Mỗi đơn chỉ đánh giá 1 lần và không sửa được.</p>
        <div className="flex justify-center gap-1" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} sao`} onClick={() => setStars(n)}>
              <Star className={`w-8 h-8 ${n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RATING_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tags.includes(t) ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <TextArea label="Nhận xét" value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};

/* ------------------------------------ UC-CUS-15 Báo sự cố + UC-CUS-17 hoàn tiền */
const CUSTOMER_INCIDENT_TYPES: IncidentType[] = ['DamagedCargo', 'VehicleBreakdown', 'Accident', 'Other'];

export const IncidentReportModal: React.FC<BaseProps> = ({ order, onClose }) => {
  const [type, setType] = useState<IncidentType>('Other');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [wantRefund, setWantRefund] = useState(false);
  const [amount, setAmount] = useState(0);
  const { pending, error, submit } = useSubmit(onClose);
  const refundable = isRefundable(order);

  const handle = () =>
    submit(async () => {
      const incident = await caseService.reportIncident(order, { reportedBy: 'Customer', type, description, photos });
      if (wantRefund) await caseService.requestIncidentRefund(incident.id, { reason: description, evidence: photos, requestedAmount: amount });
    }, 'Đã gửi báo cáo sự cố tới điều phối viên.');

  return (
    <Modal open title={`Báo sự cố – ${order.code}`} onClose={onClose} footer={<Button size="sm" isLoading={pending} onClick={handle}>Gửi báo cáo</Button>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CUSTOMER_INCIDENT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${type === t ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-200 text-slate-600'}`}>
              {INCIDENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <TextArea label="Mô tả sự cố" required value={description} onChange={(e) => setDescription(e.target.value)} />
        <PhotoUploader label="Ảnh minh chứng" value={photos} onChange={setPhotos} max={BUSINESS.MAX_EVIDENCE_PHOTOS} upload={customerUploadService.uploadImage} />
        {refundable && (
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={wantRefund} onChange={(e) => setWantRefund(e.target.checked)} />
            Yêu cầu hoàn tiền do sự cố
          </label>
        )}
        {wantRefund && (
          <Field label={`Số tiền yêu cầu (tối đa ${formatCurrency(order.fare.total)})`} type="number" min={1} max={order.fare.total} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
        )}
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};
