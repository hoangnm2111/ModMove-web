import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/kit';
import { errorMessage } from '../../services/mock/storage';

type Role = 'All' | 'Driver' | 'Customer';
const ROLES: { value: Role; label: string }[] = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Driver', label: 'Rút tiền tài xế' },
  { value: 'Customer', label: 'Hoàn tiền khách hàng' },
];

/** Xuất bảng kê lệnh chi hộ (GET admin/Reports/payouts/export) để chuyển khoản hàng loạt. */
export const ExportPayoutsButton: React.FC<{ defaultRole?: Role }> = ({ defaultRole = 'All' }) => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(defaultRole);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (from && to && to < from) return toast.error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
    setBusy(true);
    try {
      await adminApi.exportPayouts({ role, fromDate: from || undefined, toDate: to || undefined });
      toast.success('Đã xuất bảng kê chi hộ.');
      setOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="w-4 h-4 mr-1" /> Xuất Excel chi hộ
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Xuất bảng kê chi hộ"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button size="sm" onClick={submit} isLoading={busy}>
              Xuất Excel
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Đối tượng
            <Select className="w-full mt-1" value={role} onChange={(e) => setRole(e.target.value as Role)} options={ROLES} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-700">
              Từ ngày
              <input type="date" className={`${input} mt-1`} value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Đến ngày
              <input type="date" className={`${input} mt-1`} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
};
