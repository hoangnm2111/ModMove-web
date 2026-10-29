import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Star,
  Search,
  Filter,
  DollarSign,
  User,
  Phone,
  Calendar,
  Send,
  MessageSquare,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface CustomerComplaint {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  driverName: string;
  driverPhone: string;
  ratingScore: number;
  complaintType: string;
  complaintContent: string;
  damageEvidenceUrl: string;
  podEvidenceUrl: string;
  orderTotalFee: number;
  status: 'PENDING_PROPOSAL' | 'PROPOSED_TO_ADMIN' | 'REJECTED';
  proposedRefundAmount?: number;
  proposalNote?: string;
  submittedAt: string;
}

const INITIAL_COMPLAINTS: CustomerComplaint[] = [
  {
    id: 'cmp_01',
    orderCode: 'MM-90182',
    customerName: 'Hoàng Nguyễn Mạnh',
    customerPhone: '0338967316',
    driverName: 'Nguyễn Văn Hùng',
    driverPhone: '0912345678',
    ratingScore: 2,
    complaintType: 'Hàng hóa bị trầy xước & Giao trễ',
    complaintContent: 'Bàn làm việc gỗ sồi bị trầy sâu một góc cạnh do chằng buộc lỏng lẻo trong thùng xe, đồng thời giao trễ 45 phút so với lịch hẹn.',
    damageEvidenceUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
    podEvidenceUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    orderTotalFee: 580000,
    status: 'PENDING_PROPOSAL',
    submittedAt: 'Hôm nay, 16:30',
  },
  {
    id: 'cmp_02',
    orderCode: 'MM-78102',
    customerName: 'Phạm Hương Giang',
    customerPhone: '0904112233',
    driverName: 'Lê Thanh Bình',
    driverPhone: '0977889900',
    ratingScore: 1,
    complaintType: 'Thái độ phục vụ & Thu cước sai',
    complaintContent: 'Tài xế tự ý thu thêm 100k tiền bê vác dù tôi đã đặt gói dịch vụ bốc xếp trọn gói trên ứng dụng.',
    damageEvidenceUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    podEvidenceUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    orderTotalFee: 320000,
    status: 'PROPOSED_TO_ADMIN',
    proposedRefundAmount: 100000,
    proposalNote: 'Đã xác minh tài xế thu sai phụ phí. Đề xuất hoàn lại 100.000 VNĐ cho khách hàng.',
    submittedAt: 'Hôm qua, 11:20',
  },
];

export const DispatcherComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(INITIAL_COMPLAINTS);
  const [selectedComplaint, setSelectedComplaint] = useState<CustomerComplaint>(INITIAL_COMPLAINTS[0]);

  // Form states for proposal to Admin
  const [proposedAmount, setProposedAmount] = useState<number>(300000);
  const [proposalNote, setProposalNote] = useState<string>(
    'Đã đối soát ảnh POD và xác nhận vết trầy xước bàn gỗ phát sinh trong lúc vận chuyển. Đề xuất bồi hoàn 300.000 VNĐ từ tiền cước.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit proposal to Admin queue (UC-DIS-09 & UC-DIS-17)
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const updated = complaints.map((c) =>
        c.id === selectedComplaint.id
          ? {
              ...c,
              status: 'PROPOSED_TO_ADMIN' as const,
              proposedRefundAmount: proposedAmount,
              proposalNote: proposalNote,
            }
          : c
      );
      setComplaints(updated);
      setSelectedComplaint((prev) => ({
        ...prev,
        status: 'PROPOSED_TO_ADMIN',
        proposedRefundAmount: proposedAmount,
        proposalNote: proposalNote,
      }));
    }, 800);
  };

  // Reject complaint (UC-DIS-10)
  const handleRejectComplaint = () => {
    const updated = complaints.map((c) =>
      c.id === selectedComplaint.id
        ? {
            ...c,
            status: 'REJECTED' as const,
            proposalNote: 'Bác bỏ khiếu nại: Hàng hóa đã có dấu hiệu trầy xước từ trước lúc bốc lên xe.',
          }
        : c
    );
    setComplaints(updated);
    setSelectedComplaint((prev) => ({
      ...prev,
      status: 'REJECTED',
      proposalNote: 'Bác bỏ khiếu nại: Hàng hóa đã có dấu hiệu trầy xước từ trước lúc bốc lên xe.',
    }));
  };

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: COMPLAINTS LIST */}
      {/* ========================================================================= */}
      <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 shadow-sm z-10">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-black text-sm text-slate-900">Thẩm định khiếu nại</h1>
                <p className="text-[11px] text-slate-400">Đề xuất hoàn tiền chuyển Admin duyệt</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded-full">
              {complaints.filter((c) => c.status === 'PENDING_PROPOSAL').length} chờ xử lý
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {complaints.map((c) => {
            const isSelected = selectedComplaint.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedComplaint(c);
                  if (c.proposedRefundAmount) setProposedAmount(c.proposedRefundAmount);
                  if (c.proposalNote) setProposalNote(c.proposalNote);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded">
                    {c.orderCode}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      c.status === 'PENDING_PROPOSAL'
                        ? 'bg-amber-100 text-amber-700'
                        : c.status === 'PROPOSED_TO_ADMIN'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {c.status === 'PENDING_PROPOSAL'
                      ? 'Chưa đề xuất'
                      : c.status === 'PROPOSED_TO_ADMIN'
                      ? 'Đã chuyển Admin'
                      : 'Đã bác bỏ'}
                  </span>
                </div>

                <div className="font-black text-xs text-slate-900 mb-0.5">{c.customerName}</div>
                <div className="text-xs text-slate-600 font-semibold line-clamp-1">{c.complaintType}</div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{c.ratingScore} sao</span>
                  </span>
                  <span>{c.submittedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: CROSS-VERIFICATION & PROPOSAL CONSOLE */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-50 text-brand-600 border border-orange-200 text-xs font-black px-2 py-0.5 rounded">
                    MÃ ĐƠN: #{selectedComplaint.orderCode}
                  </span>
                  <span className="text-xs text-slate-500">Giá trị đơn: <strong>{formatCurrency(selectedComplaint.orderTotalFee)}</strong></span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{selectedComplaint.complaintType}</h2>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedComplaint.customerPhone}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Phone className="w-4 h-4 text-sky-600" />
                  <span>Gọi khách ({selectedComplaint.customerPhone})</span>
                </a>
                <a
                  href={`tel:${selectedComplaint.driverPhone}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Gọi tài xế ({selectedComplaint.driverPhone})</span>
                </a>
              </div>
            </div>

            {/* Complaint Text & Evidence Photo Comparison */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  NỘI DUNG PHẢN ÁNH CỦA KHÁCH HÀNG:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  "{selectedComplaint.complaintContent}"
                </p>
              </div>

              {/* Side-by-side Evidence Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Ảnh khách hàng cung cấp (Bằng chứng hư hại):</span>
                  </span>
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedComplaint.damageEvidenceUrl}
                      alt="Ảnh hư hại"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Ảnh giao hàng của tài xế (Biên bản POD):</span>
                  </span>
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedComplaint.podEvidenceUrl}
                      alt="Ảnh POD"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Decision Form (UC-DIS-09 & UC-DIS-17) */}
            <form onSubmit={handleSubmitProposal} className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Đề xuất phương án bồi hoàn lên Quản trị viên (Admin)</h3>
                  <p className="text-xs text-slate-400">
                    Quyết định bồi thường sẽ được chuyển vào hàng đợi duyệt chi trả của Quản trị viên
                  </p>
                </div>
                {selectedComplaint.status === 'PROPOSED_TO_ADMIN' && (
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-black">
                    ĐÃ GỬI LÊN ADMIN
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Số tiền đề xuất hoàn (VNĐ):
                  </label>
                  <input
                    type="number"
                    step={10000}
                    max={selectedComplaint.orderTotalFee}
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(Number(e.target.value))}
                    disabled={selectedComplaint.status === 'PROPOSED_TO_ADMIN'}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Tối đa bằng cước đơn: {formatCurrency(selectedComplaint.orderTotalFee)}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Căn cứ giải trình & ghi chú nghiệp vụ:
                  </label>
                  <input
                    type="text"
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    disabled={selectedComplaint.status === 'PROPOSED_TO_ADMIN'}
                    placeholder="Nhập lý do bồi thường hoặc kết quả thương lượng..."
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                {selectedComplaint.status !== 'PROPOSED_TO_ADMIN' && (
                  <>
                    <button
                      type="button"
                      onClick={handleRejectComplaint}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      Bác bỏ khiếu nại
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-sky-500/20"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi đề xuất sang Quản trị viên duyệt'}</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
