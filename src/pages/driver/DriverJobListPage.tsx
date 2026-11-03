import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Power, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { haversineKm } from '../../domain/geo';
import { hasEnoughDeposit } from '../../domain/orderRules';
import { calculateCommission, calculateDriverEarning } from '../../domain/pricing';
import { useAvailableJobs, usePlatformSettings } from '../../hooks/useDomainData';
import { useDriverContext } from '../../hooks/useDriverContext';
import { useAcceptJob } from '../../features/driver/useAcceptJob';
import { driverService } from '../../services/driver.service';
import { errorMessage } from '../../services/mock/storage';
import { ShippingOrder } from '../../types/order.types';
import { formatCurrency, timeAgo } from '../../utils/format';

type PaymentFilter = 'ALL' | 'PayOS' | 'Cash';

/** SCR-19/21 – Danh sách việc gần bạn (UC-DRV-08/09/10) */
export const DriverJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const { driverId, isApproved, isOnline, wallet, activeTrip, asAssigned, application } = useDriverContext();
  const jobs = useAvailableJobs();
  const { commissionRate } = usePlatformSettings();
  const accept = useAcceptJob();
  const [payment, setPayment] = useState<PaymentFilter>('ALL');
  const [detail, setDetail] = useState<ShippingOrder | null>(null);
  const [toggling, setToggling] = useState(false);

  // GB-08: đơn trong bán kính, gần nhất trước
  const list = useMemo(() => {
    const here = asAssigned ? { lat: asAssigned.currentLat, lng: asAssigned.currentLng } : null;
    return jobs
      .map((j) => ({ job: j, distance: here ? Math.round(haversineKm(here, j.pickup) * 10) / 10 : 0 }))
      .filter(({ job }) => payment === 'ALL' || job.paymentMethod === payment)
      .sort((a, b) => a.distance - b.distance);
  }, [jobs, payment, asAssigned]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const next = await driverService.setOnline(driverId, !isOnline);
      toast.info(next ? 'Bạn đang trực tuyến và có thể nhận đơn.' : 'Bạn đã nghỉ ca.');
    } catch (e) {
      toast.warning(errorMessage(e));
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (job: ShippingOrder) => {
    const ok = await confirm({
      title: `Nhận đơn ${job.code}?`,
      message: `Thu nhập dự kiến ${formatCurrency(calculateDriverEarning(job.fare.total, commissionRate))}. Sau khi nhận, bạn không thể tự huỷ đơn (GB-36).`,
      confirmText: 'Nhận đơn',
    });
    if (ok) {
      setDetail(null);
      await accept(job.id);
    }
  };

  const depositLow = wallet.depositBalance < BUSINESS.MIN_COD_DEPOSIT;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 min-w-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-black text-slate-900 mr-auto">Đơn hàng gần bạn</h1>
          <Button variant={isOnline ? 'danger' : 'primary'} size="sm" onClick={toggleOnline} isLoading={toggling} disabled={!isApproved && !isOnline}>
            <Power className="w-4 h-4 mr-1.5" /> {isOnline ? 'Nghỉ ca' : 'Bật trực tuyến'}
          </Button>
        </header>

        {!isApproved && (
          <Banner kind="warning">
            {msg('MSG25')} Trạng thái hồ sơ: <b>{application?.status ?? 'Chưa nộp'}</b>.{' '}
            <button className="underline font-bold" onClick={() => navigate('/driver/profile')}>
              Xem hồ sơ
            </button>
          </Banner>
        )}
        {depositLow && (
          <Banner kind="warning">
            {msg('MSG26', { required_balance: formatCurrency(BUSINESS.MIN_COD_DEPOSIT) })}{' '}
            <button className="underline font-bold" onClick={() => navigate('/driver/earnings')}>
              Nạp ký quỹ
            </button>
          </Banner>
        )}
        {activeTrip && (
          <Banner kind="info">
            Bạn đang thực hiện đơn {activeTrip.code} – mỗi tài xế chỉ nhận 1 đơn một lúc (GB-09).{' '}
            <button className="underline font-bold" onClick={() => navigate('/driver/trip')}>
              Mở chuyến
            </button>
          </Banner>
        )}

        <div className="flex items-center gap-2">
          {(['ALL', 'PayOS', 'Cash'] as PaymentFilter[]).map((p) => (
            <button key={p} type="button" onClick={() => setPayment(p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${payment === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>
              {p === 'ALL' ? 'Tất cả' : p === 'PayOS' ? 'Đã thanh toán PayOS' : 'Tiền mặt'}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Tự cập nhật
          </span>
        </div>

        {!isOnline ? (
          <p className="text-center text-sm text-slate-500 py-12">Bật trực tuyến để xem và nhận đơn.</p>
        ) : list.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">Hiện chưa có đơn phù hợp trong khu vực.</p>
        ) : (
          <ul className="space-y-3">
            {list.map(({ job, distance }) => {
              const cashBlocked = job.paymentMethod === 'Cash' && !hasEnoughDeposit(wallet.depositBalance, calculateCommission(job.fare.total, commissionRate));
              return (
                <li key={job.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-sm">{job.code}</b>
                    <span className="text-[11px] text-slate-400">{timeAgo(job.paymentMethod === 'PayOS' ? job.paidAt : job.createdAt)}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100">{distance} km tới điểm lấy</span>
                    <span className="ml-auto font-black text-emerald-700">{formatCurrency(calculateDriverEarning(job.fare.total, commissionRate))}</span>
                  </div>
                  <p className="text-xs flex gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> {job.pickup.address}
                  </p>
                  <p className="text-xs flex gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {job.dropoff.address}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {job.vehicle.name} • {job.fare.distanceKm} km • {job.cargo.weightKg} kg • {job.paymentMethod === 'Cash' ? 'Tiền mặt' : 'PayOS'}
                    {job.loadingService && ' • Có bốc xếp'}
                  </p>
                  {cashBlocked && <Banner kind="warning">{msg('MSG26', { required_balance: formatCurrency(Math.max(BUSINESS.MIN_COD_DEPOSIT, calculateCommission(job.fare.total, commissionRate))) })}</Banner>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetail(job)}>
                      Chi tiết
                    </Button>
                    <Button size="sm" disabled={Boolean(activeTrip) || cashBlocked} onClick={() => handleAccept(job)}>
                      Nhận đơn
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {detail && (
        <Modal
          open
          title={`Chi tiết đơn ${detail.code}`}
          onClose={() => setDetail(null)}
          footer={
            <Button size="sm" disabled={Boolean(activeTrip)} onClick={() => handleAccept(detail)}>
              Nhận đơn
            </Button>
          }
        >
          <dl className="text-xs grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
            <dt className="text-slate-500">Điểm lấy</dt>
            <dd>{detail.pickup.address}</dd>
            <dt className="text-slate-500">Điểm giao</dt>
            <dd>{detail.dropoff.address}</dd>
            <dt className="text-slate-500">Quãng đường</dt>
            <dd>
              {detail.fare.distanceKm} km (~{detail.fare.durationMins} phút)
            </dd>
            <dt className="text-slate-500">Hàng hoá</dt>
            <dd>
              {detail.cargo.description} • {detail.cargo.quantity} kiện • {detail.cargo.weightKg} kg
            </dd>
            {detail.cargo.specialNotes && (
              <>
                <dt className="text-slate-500">Lưu ý bốc xếp</dt>
                <dd>{detail.cargo.specialNotes}</dd>
              </>
            )}
            <dt className="text-slate-500">Thanh toán</dt>
            <dd>{detail.paymentMethod === 'Cash' ? `Tiền mặt – ${detail.payerRole === 'Receiver' ? 'người nhận trả' : 'người gửi trả'}` : 'PayOS (đã thanh toán)'}</dd>
            <dt className="text-slate-500">Tổng cước</dt>
            <dd>{formatCurrency(detail.fare.total)}</dd>
            <dt className="text-slate-500">Hoa hồng ({Math.round(commissionRate * 100)}%)</dt>
            <dd>-{formatCurrency(calculateCommission(detail.fare.total, commissionRate))}</dd>
            <dt className="text-slate-500 font-bold">Thực nhận</dt>
            <dd className="font-black text-emerald-700">{formatCurrency(calculateDriverEarning(detail.fare.total, commissionRate))}</dd>
          </dl>
        </Modal>
      )}
    </div>
  );
};
