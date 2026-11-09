import React from 'react';
import { Info, PiggyBank, ShieldCheck, Wallet } from 'lucide-react';
import { Banner } from '../../components/ui/feedback';
import { Card, Loading, PageShell, StatCard } from '../../components/ui/kit';
import { useDriver } from '../../features/driver/DriverContext';
import { formatCurrency } from '../../utils/format';

/** UC-DRV-20 – Số dư ví (GET /driver/status). Nạp cọc / rút tiền / báo cáo thu nhập chưa có API backend. */
export const DriverEarningsPage: React.FC = () => {
  const { status: s } = useDriver();
  if (!s)
    return (
      <PageShell title="Ví & thu nhập">
        <Loading />
      </PageShell>
    );
  const debt = Math.min(0, s.depositBalance);
  const withdrawable = Math.max(0, s.earningsBalance + debt);
  return (
    <PageShell title="Ví & thu nhập" subtitle="Hai số dư tách biệt: ví cọc (đảm bảo hoa hồng đơn tiền mặt) và thu nhập (rút được)">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <StatCard label="Thu nhập (EarningsBalance)" value={formatCurrency(s.earningsBalance)} hint="Thu nhập đơn PayOS, rút được" icon={<Wallet className="w-5 h-5" />} accent="bg-emerald-50 text-emerald-600" />
          <StatCard
            label="Ví cọc (DepositBalance)"
            value={<span className={s.depositBalance < 0 ? 'text-rose-600' : ''}>{formatCurrency(s.depositBalance)}</span>}
            hint="Bị trừ hoa hồng đơn tiền mặt, không rút được"
            icon={<PiggyBank className="w-5 h-5" />}
          />
          <StatCard label="Có thể rút tối đa" value={formatCurrency(withdrawable)} hint={debt < 0 ? `Đã trừ nợ ví cọc ${formatCurrency(-debt)}` : 'Không có nợ ví cọc'} icon={<ShieldCheck className="w-5 h-5" />} accent="bg-indigo-50 text-indigo-600" />
        </div>
        {s.walletStatus && s.walletStatus !== 'Active' && <Banner kind="warning">Ví đang bị khoá ({s.walletStatus}). Liên hệ quản trị viên.</Banner>}
        {s.depositBalance < 0 && <Banner kind="error">Ví cọc đang âm – bạn không nhận được đơn tiền mặt cho tới khi nạp thêm (GB-15, GB-16).</Banner>}
        <Card title="Quy định ví (GB-32, 5.1, 5.2)">
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
            <li>Nạp cọc qua PayOS, tối thiểu 50.000đ mỗi lần. Nhận đơn tiền mặt cần ví cọc ≥ mức ký quỹ tối thiểu và ≥ hoa hồng của đơn.</li>
            <li>Đơn tiền mặt: hoa hồng trừ vào ví cọc khi hoàn tất (ví được phép âm). Đơn PayOS: thu nhập (cước − hoa hồng) cộng vào ví thu nhập.</li>
            <li>Rút thu nhập không có mức tối thiểu, một yêu cầu chờ tại một thời điểm; nợ ví cọc được trừ trước. Admin chuyển khoản thủ công trong 3 ngày làm việc.</li>
          </ul>
        </Card>
        <Banner kind="info">
          <span className="inline-flex gap-1.5">
            <Info className="w-4 h-4 flex-shrink-0" /> Nạp cọc (UC-DRV-21), yêu cầu rút tiền (UC-DRV-22), lịch sử giao dịch và báo cáo thu nhập theo ngày/tuần/tháng (UC-DRV-23) thực hiện trên app
            tài xế – backend hiện chưa có API cho web.
          </span>
        </Banner>
      </div>
    </PageShell>
  );
};
