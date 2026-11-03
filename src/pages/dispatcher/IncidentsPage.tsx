import React, { useState } from 'react';
import {
  ShieldAlert,
  Repeat,
  CheckCircle,
  Clock,
  PhoneCall,
  XCircle,
  Truck,
  MapPin,
  AlertTriangle,
  RotateCcw,
  User,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  Filter,
  Search,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

import { toast } from '../../components/ui/feedback';
import { INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL } from '../../constants';
import { msg } from '../../constants/messages';
import { useAllOrders, useIncidents, useUsers } from '../../hooks/useDomainData';
import { useLiveData } from '../../hooks/useLiveData';
import { caseService } from '../../services/case.service';
import { driverService } from '../../services/driver.service';
import { errorMessage } from '../../services/mock/storage';
import { IncidentDecision } from '../../types/case.types';
import { AssignedDriver } from '../../types/order.types';
import { timeAgo } from '../../utils/format';

type TicketStatus = 'OPEN' | 'RESOLVING' | 'RESOLVED_CONTINUE' | 'RESOLVED_REASSIGN' | 'RESOLVED_CANCELLED' | 'CANCELLED';
const DECISION_STATUS: Record<IncidentDecision, TicketStatus> = {
  ContinueTrip: 'RESOLVED_CONTINUE',
  ReassignDriver: 'RESOLVED_REASSIGN',
  CancelOrder: 'RESOLVED_CANCELLED',
};

/** SCR-40/41 – Xử lý sự cố (UC-DIS-03/04/05/06/07/10) */
export const IncidentsPage: React.FC = () => {
  const rawIncidents = useIncidents();
  const orders = useAllOrders();
  const users = useUsers();
  const [apps] = useLiveData(driverService.listLatestApplicationsSync, driverService.subscribe);

  const incidents = rawIncidents.map((i) => {
    const o = orders.find((x) => x.id === i.orderId);
    const status: TicketStatus =
      i.status === 'Open' ? 'OPEN' : i.status === 'InProgress' ? 'RESOLVING' : i.status === 'Cancelled' ? 'CANCELLED' : DECISION_STATUS[i.decision ?? 'ContinueTrip'];
    return {
      id: i.id,
      orderId: i.orderId,
      orderCode: i.orderCode,
      vehicleTypeId: o?.vehicle.id,
      currentDriverId: o?.assignedDriver?.id,
      paymentMethod: o?.paymentMethod,
      customerName: o?.customerName ?? '—',
      customerPhone: o?.customerPhone ?? '',
      driverName: o?.assignedDriver?.name ?? '—',
      driverPhone: o?.assignedDriver?.phone ?? '',
      vehiclePlate: o?.assignedDriver?.licensePlate ?? '',
      vehicleType: o?.vehicle.name ?? '',
      type: `${INCIDENT_TYPE_LABEL[i.type]} (${i.reportedBy === 'Driver' ? 'tài xế báo' : 'khách báo'})`,
      description: i.description,
      evidencePhoto: i.photos[0] ?? '',
      severity: (i.type === 'Accident' || i.type === 'DamagedCargo' ? 'HIGH' : i.type === 'VehicleBreakdown' ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
      status,
      statusLabel: INCIDENT_STATUS_LABEL[i.status],
      reportedAt: timeAgo(i.createdAt),
      dispatcherDecision: i.decisionNote,
    };
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIncident = incidents.find((i) => i.id === selectedId) ?? incidents[0];
  const setSelectedIncident = (i: { id: string }) => setSelectedId(i.id);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelRefundable, setCancelRefundable] = useState(true);

  /**
   * GB-37: tài xế thay thế phải Approved, cùng loại xe, không có đơn đang chạy.
   * (Online & ký quỹ được kiểm tra thêm ở backend.)
   */
  const candidates: AssignedDriver[] = selectedIncident
    ? apps
        .filter((a) => a.status === 'Approved' && a.vehicleCategory === selectedIncident.vehicleTypeId && a.driverId !== selectedIncident.currentDriverId)
        .filter((a) => !orders.some((o) => o.assignedDriver?.id === a.driverId && ['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(o.status)))
        .map((a) => ({
          id: a.driverId,
          name: a.fullName,
          phone: a.phoneNumber,
          avatar: users.find((x) => x.id === a.driverId)?.avatarUrl ?? '',
          rating: 4.8,
          licensePlate: a.licensePlate,
          currentLat: 21.03,
          currentLng: 105.8,
          lastLocationAt: new Date().toISOString(),
        }))
    : [];

  const isClosed = !selectedIncident || !['OPEN', 'RESOLVING'].includes(selectedIncident.status);

  const decide = async (decision: IncidentDecision, note: string, extra?: { newDriver?: AssignedDriver; refundable?: boolean }) => {
    if (!selectedIncident) return;
    try {
      await caseService.resolveIncident(selectedIncident.id, decision, note, extra);
      toast.success(msg('MSG59', { case_type: 'Sự cố', case_id: selectedIncident.id, status: 'Đã giải quyết', additional_information: note }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // 1. Cho tiếp tục chuyến
  const handleDecisionContinue = () => decide('ContinueTrip', 'Cho phép tài xế khắc phục tại chỗ và tiếp tục vận chuyển.');

  // 2. Đổi tài xế (UC-DIS-06)
  const handleConfirmReassign = async (driver: AssignedDriver) => {
    await decide('ReassignDriver', `Điều xe thay thế ${driver.name} (${driver.licensePlate}); tài xế mới kiểm hàng lại từ đầu (GB-37).`, { newDriver: driver });
    setShowReassignModal(false);
  };

  // 3. Huỷ đơn (UC-DIS-07) – GB-38 hoàn 100% PayOS; GB-07/GB-35 không hoàn
  const handleConfirmCancel = async () => {
    const reason = cancelReasonInput.trim() || 'Không thể tiếp tục chuyến do sự cố';
    await decide('CancelOrder', reason, { refundable: cancelRefundable });
    setShowCancelModal(false);
    setCancelReasonInput('');
  };

  // UC-DIS-10: huỷ sự cố không hợp lệ
  const handleCancelIncident = async () => {
    if (!selectedIncident) return;
    const reason = window.prompt('Lý do huỷ sự cố (không hợp lệ / không đủ căn cứ):') ?? '';
    if (!reason.trim()) return;
    try {
      await caseService.cancelIncident(selectedIncident.id, reason);
      toast.success(msg('MSG59', { case_type: 'Sự cố', case_id: selectedIncident.id, status: 'Đã huỷ', additional_information: reason }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!selectedIncident) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Chưa có sự cố nào được báo cáo.</div>;
  }

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: INCIDENT QUEUE */}
      {/* ========================================================================= */}
      <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 shadow-sm z-10">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-black text-sm text-slate-900">Sự cố hành trình</h1>
                <p className="text-[11px] text-slate-400">Tiếp nhận báo cáo khẩn từ tài xế</p>
              </div>
            </div>
            <span className="text-xs bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-full">
              {incidents.filter((i) => i.status === 'OPEN' || i.status === 'RESOLVING').length} chưa đóng
            </span>
          </div>
        </div>

        {/* List of incidents */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {incidents.map((inc) => {
            const isSelected = selectedIncident.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded">
                    {inc.orderCode}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      inc.status === 'OPEN'
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : inc.status === 'RESOLVING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {inc.status === 'OPEN'
                      ? 'Chưa xử lý'
                      : inc.status === 'RESOLVING'
                      ? 'Đang giải quyết'
                      : 'Đã có quyết định'}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 mb-1 line-clamp-1">{inc.type}</div>
                <div className="text-xs text-slate-500 font-medium line-clamp-2">{inc.description}</div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tài xế: <strong className="text-slate-700">{inc.driverName}</strong></span>
                  <span>{inc.reportedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: RESOLUTION CONSOLE */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
            {/* Header of Selected Incident */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-2 py-0.5 rounded">
                    MỨC ĐỘ: {selectedIncident.severity}
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-500">Mã đơn: #{selectedIncident.orderCode}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{selectedIncident.type}</h2>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 select-text">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>Tài xế: {selectedIncident.driverPhone}</span>
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 select-text">
                  <PhoneCall className="w-4 h-4 text-sky-600" />
                  <span>Khách: {selectedIncident.customerPhone}</span>
                </span>
              </div>
            </div>

            {/* Stakeholder Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">TÀI XẾ PHỤ TRÁCH</span>
                <span className="font-black text-slate-900 mt-0.5 block">{selectedIncident.driverName}</span>
                <span className="text-slate-500 font-mono text-[11px]">{selectedIncident.driverPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">PHƯƠNG TIỆN / BIỂN SỐ</span>
                <span className="font-black text-slate-900 mt-0.5 block font-mono">{selectedIncident.vehiclePlate}</span>
                <span className="text-slate-500 text-[11px]">{selectedIncident.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">KHÁCH HÀNG ĐẶT ĐƠN</span>
                <span className="font-black text-slate-900 mt-0.5 block">{selectedIncident.customerName}</span>
                <span className="text-slate-500 font-mono text-[11px]">{selectedIncident.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">THỜI ĐIỂM BÁO CÁO</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedIncident.reportedAt}</span>
              </div>
            </div>

            {/* Evidence & Photo Box */}
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Mô tả hiện trường & Bằng chứng hình ảnh:
              </span>
              <p className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {selectedIncident.description}
              </p>

              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center h-72">
                <img
                  src={selectedIncident.evidencePhoto}
                  alt="Ảnh sự cố"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Decision Status Output Banner */}
            {selectedIncident.dispatcherDecision && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-xs text-sky-950">Quyết định xử lý từ Điều phối viên:</div>
                  <div className="text-xs text-sky-800 mt-0.5">{selectedIncident.dispatcherDecision}</div>
                </div>
              </div>
            )}

            {/* Decision Actions Workspace (UC-DIS-05) */}
            {!isClosed && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-sky-950 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Bảng quyết định xử lý sự cố (UC-DIS-05)</h3>
                  <p className="text-xs text-slate-300">
                    Lựa chọn phương án phù hợp để đảm bảo an toàn hàng hóa và tiến độ giao hàng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Option 1: Continue */}
                <button
                  type="button"
                  onClick={handleDecisionContinue}
                  className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-left transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-emerald-400">1. Cho tiếp tục chuyến đi</span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Tài xế đã tự khắc phục sự cố tại chỗ hoặc đổi lốp xong.
                  </span>
                </button>

                {/* Option 2: Reassign Driver */}
                <button
                  type="button"
                  onClick={() => setShowReassignModal(true)}
                  className="p-3.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-left transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-sky-400">2. Điều xe khác thay thế</span>
                    <Repeat className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Xe hiện tại không chạy được, điều động xe gần nhất sang sang hàng.
                  </span>
                </button>

                {/* Option 3: Cancel Order */}
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-left transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-rose-400">3. Hủy đơn do bất khả kháng</span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Hàng quá tải/hư hỏng, trả hàng về kho và kích hoạt hoàn tiền.
                  </span>
                </button>
              </div>
              <button type="button" onClick={handleCancelIncident} className="text-[11px] font-bold text-slate-300 underline">
                Huỷ sự cố (không hợp lệ – UC-DIS-10)
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* REASSIGN DRIVER MODAL (UC-DIS-06) */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Repeat className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Điều phối xe thay thế tiếp quản đơn</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn một tài xế đang rảnh ở khu vực lân cận để sang hàng cho đơn <strong>#{selectedIncident.orderCode}</strong>:
            </p>

            {/* Candidate Drivers List */}
            <div className="space-y-2">
              {candidates.length === 0 && <p className="text-xs text-slate-500">Không có tài xế phù hợp (cùng loại xe, đã duyệt, đang rảnh). Hãy huỷ đơn theo GB-38.</p>}
              {candidates.map((cand, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-black text-xs text-slate-900">{cand.name} ({cand.phone})</div>
                    <div className="text-[11px] text-slate-500 font-mono">{cand.licensePlate} • {selectedIncident.vehicleType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Đang rảnh
                    </span>
                    <button
                      type="button"
                      onClick={() => handleConfirmReassign(cand)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      Điều xe này
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL (UC-DIS-07) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Xác nhận hủy đơn hàng do sự cố</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Đơn hàng sẽ được chuyển sang trạng thái <strong>Đã hủy</strong>. Với đơn PayOS đã thanh toán, hệ thống tạo khoản hoàn 100% chuyển Quản trị viên duyệt; đơn tiền mặt được giải quyết ngoài hệ thống.
            </p>

            <textarea
              rows={3}
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="Nhập lý do chi tiết (Ví dụ: Khách không đồng ý sang xe, hàng dễ vỡ không thể tiếp tục)..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
            {selectedIncident.paymentMethod === 'PayOS' && (
              <label className="flex items-start gap-2 text-xs text-slate-700">
                <input type="checkbox" checked={cancelRefundable} onChange={(e) => setCancelRefundable(e.target.checked)} className="mt-0.5" />
                <span>Hoàn 100% cho khách (GB-38). Bỏ chọn nếu huỷ do hàng cấm (GB-07) hoặc khách vắng mặt (GB-35).</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                Xác nhận Hủy chuyến
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
