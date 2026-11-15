import React from 'react';
import { Banknote, QrCode, Ticket } from 'lucide-react';
import { customerApi } from '../../../api/endpoints';
import { useQuery } from '../../../api/useQuery';
import { useAuthStore } from '../../../store/useAuthStore';
import { Field } from '../../../components/ui/Field';
import { Banner } from '../../../components/ui/feedback';
import { BookingDraft } from '../../../types/order.types';
import { formatCurrency } from '../../../utils/format';
import { StepErrors } from '../bookingValidation';

interface Props {
  draft: BookingDraft;
  loadingFee: number;
  couponError: string | null;
  discount: number;
  errors: StepErrors;
  onChange: (p: Partial<BookingDraft>) => void;
  onShowWarranty: () => void;
}

const OptionCard: React.FC<{ active: boolean; onClick: () => void; title: string; desc: string; icon: React.ReactNode }> = ({ active, onClick, title, desc, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left p-3 rounded-xl border flex gap-3 items-start transition ${active ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40' : 'border-slate-200 bg-white hover:border-slate-400'}`}
  >
    <span className="mt-0.5">{icon}</span>
    <span>
      <span className="block text-sm font-extrabold text-slate-900">{title}</span>
      <span className="block text-[11px] text-slate-500">{desc}</span>
    </span>
  </button>
);

/** GET /customer/Coupons – mã đang dùng được (chỉ khi đã đăng nhập Customer) */
const AvailableCoupons: React.FC<{ selected: string; onPick: (code: string) => void }> = ({ selected, onPick }) => {
  const isCustomer = useAuthStore((s) => s.activeRole === 'Customer');
  const q = useQuery(() => customerApi.coupons(1, 20), [], { enabled: isCustomer });
  const items = q.data?.items ?? [];
  if (!isCustomer) return <p className="mt-2 text-[11px] text-slate-400">Đăng nhập để xem các mã giảm giá đang có.</p>;
  if (items.length === 0) return q.loading ? null : <p className="mt-2 text-[11px] text-slate-400">Hiện chưa có mã giảm giá khả dụng.</p>;
  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-2">
      {items.map((c) => (
        <button
          key={c.discountCode}
          type="button"
          onClick={() => onPick(selected === c.discountCode ? '' : c.discountCode)}
          className={`text-left p-2.5 rounded-xl border text-xs transition ${selected === c.discountCode ? 'border-blue-600 bg-blue-50' : 'border-dashed border-slate-300 hover:border-slate-500'}`}
        >
          <div className="flex items-center gap-1.5 font-black text-slate-900">
            <Ticket className="w-3.5 h-3.5 text-blue-600" /> {c.discountCode}
            <span className="ml-auto text-emerald-700">-{formatCurrency(c.discountValue)}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Đơn từ {formatCurrency(c.minimumOrderValue)} • HSD {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
            {c.remainingUses !== null && ` • còn ${c.remainingUses} lượt`}
          </div>
        </button>
      ))}
    </div>
  );
};

/** Bước 4 – Dịch vụ, coupon, thanh toán, chính sách (UC-GST-12/14/15/16) */
export const PaymentStep: React.FC<Props> = ({ draft, loadingFee, couponError, discount, errors, onChange, onShowWarranty }) => (
  <div className="space-y-4">
    <section className="bg-white border border-slate-200 rounded-2xl p-4">
      <h3 className="text-sm font-extrabold text-slate-900 mb-2">Dịch vụ bốc xếp</h3>
      <label className="flex items-center justify-between gap-3 text-sm cursor-pointer">
        <span className="flex items-center gap-2.5">
          <input type="checkbox" checked={draft.loadingService} onChange={(e) => onChange({ loadingService: e.target.checked })} />
          <span>
            <span className="font-bold text-slate-800">Yêu cầu dịch vụ bốc xếp</span>
            <span className="block text-[11px] text-slate-500">Khuân vác tại điểm lấy và điểm giao.</span>
          </span>
        </span>
        <span className="font-extrabold text-slate-900">+{formatCurrency(loadingFee)}</span>
      </label>
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4">
      <h3 className="text-sm font-extrabold text-slate-900 mb-2">Mã giảm giá</h3>
      <Field
        label="Nhập mã (mỗi đơn 1 mã)"
        placeholder="VD: MODMOVE30"
        value={draft.couponCode}
        onChange={(e) => onChange({ couponCode: e.target.value.toUpperCase() })}
        error={draft.couponCode ? couponError : null}
        hint={draft.couponCode && !couponError ? `Đã áp dụng: -${formatCurrency(discount)}` : undefined}
      />
      <AvailableCoupons selected={draft.couponCode} onPick={(code) => onChange({ couponCode: code })} />
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900">Phương thức thanh toán</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <OptionCard active={draft.paymentMethod === 'PayOS'} onClick={() => onChange({ paymentMethod: 'PayOS' })} title="Thanh Toán Chuyển Khoản" desc="Quét VietQR, thanh toán trước khi tìm tài xế." icon={<QrCode className="w-5 h-5 text-blue-600" />} />
        <OptionCard active={draft.paymentMethod === 'Cash'} onClick={() => onChange({ paymentMethod: 'Cash' })} title="Thanh Toán Tiền Mặt" desc="Trả tiền mặt cho tài xế." icon={<Banknote className="w-5 h-5 text-emerald-600" />} />
      </div>
      {draft.paymentMethod === 'Cash' && (
        <div className="flex gap-4 text-xs font-semibold text-slate-700">
          {(['Sender', 'Receiver'] as const).map((r) => (
            <label key={r} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="payer" checked={draft.payerRole === r} onChange={() => onChange({ payerRole: r })} />
              {r === 'Sender' ? 'Người gửi trả khi lấy hàng' : 'Người nhận trả khi giao hàng'}
            </label>
          ))}
        </div>
      )}
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={draft.agreedNoProhibitedCargo} onChange={(e) => onChange({ agreedNoProhibitedCargo: e.target.checked })} />
        Tôi cam kết không gửi hàng cấm.
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={draft.agreedWarrantyPolicy} onChange={(e) => onChange({ agreedWarrantyPolicy: e.target.checked })} />
        <span>
          Tôi đồng ý với{' '}
          <button type="button" onClick={onShowWarranty} className="text-blue-600 font-bold underline">
            chính sách bảo hành & bồi thường
          </button>.
        </span>
      </label>
      {errors.policy && <Banner kind="error">{errors.policy}</Banner>}
    </section>
  </div>
);
