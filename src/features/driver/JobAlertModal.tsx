import React, { useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/Button';
import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { calculateDriverEarning } from '../../domain/pricing';
import { useCountdown } from '../../hooks/useLiveData';
import { useAvailableJobs, usePlatformSettings } from '../../hooks/useDomainData';
import { useDriverContext } from '../../hooks/useDriverContext';
import { useDriverStore } from '../../store/useDriverStore';
import { formatCurrency } from '../../utils/format';
import { useAcceptJob } from './useAcceptJob';

/**
 * SCR-20 – Job alert 30 giây (LI-04, MSG39).
 * Hiển thị khi tài xế Online, đã duyệt, chưa có chuyến và có đơn mới chưa bỏ qua.
 */
export const JobAlertModal: React.FC = () => {
  const { isOnline, isApproved, activeTrip } = useDriverContext();
  const jobs = useAvailableJobs();
  const { dismissedJobIds, dismissJob } = useDriverStore();
  const { commissionRate } = usePlatformSettings();
  const accept = useAcceptJob();

  const job = useMemo(
    () => (isOnline && isApproved && !activeTrip ? jobs.find((j) => !dismissedJobIds.includes(j.id)) : undefined),
    [jobs, dismissedJobIds, isOnline, isApproved, activeTrip]
  );
  // Mốc hết hạn tính lại mỗi khi có job mới
  const jobId = job?.id;
  const deadline = useMemo(() => (jobId ? Date.now() + BUSINESS.JOB_ALERT_SECONDS * 1000 : null), [jobId]);
  const left = useCountdown(deadline);

  // Hết 30 giây → bỏ qua; đơn vẫn nằm trong danh sách cho tài xế khác (GB-08)
  useEffect(() => {
    if (jobId && deadline && Date.now() >= deadline) dismissJob(jobId);
  }, [left, jobId, deadline, dismissJob]);

  if (!job || left === 0) return null;

  return (
    <Modal
      open
      title={msg('MSG39', { order_id: job.code })}
      onClose={() => dismissJob(job.id)}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => dismissJob(job.id)}>
            Bỏ qua
          </Button>
          <Button size="sm" onClick={() => accept(job.id).then((ok) => !ok && dismissJob(job.id))}>
            Nhận đơn ({left}s)
          </Button>
        </>
      }
    >
      <div className="space-y-2 text-xs">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${(left / BUSINESS.JOB_ALERT_SECONDS) * 100}%` }} />
        </div>
        <p className="flex gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> {job.pickup.address}
        </p>
        <p className="flex gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {job.dropoff.address}
        </p>
        <p>
          {job.fare.distanceKm} km • {job.vehicle.name} • {job.paymentMethod === 'Cash' ? 'Tiền mặt' : 'PayOS'}
        </p>
        <p className="text-sm">
          Thu nhập dự kiến: <b className="text-emerald-700">{formatCurrency(calculateDriverEarning(job.fare.total, commissionRate))}</b>
          <span className="text-slate-400"> (sau {Math.round(commissionRate * 100)}% hoa hồng)</span>
        </p>
      </div>
    </Modal>
  );
};
