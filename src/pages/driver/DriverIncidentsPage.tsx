import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  Eye,
  X,
  FileText,
  UserCheck,
  RotateCcw,
  Truck
} from 'lucide-react';
import { INCIDENT_TYPE_LABEL } from '../../constants';
import { useAllOrders, useIncidents } from '../../hooks/useDomainData';
import { useDriverContext } from '../../hooks/useDriverContext';
import { formatDateTime } from '../../utils/format';

interface IncidentRecord {
  id: string;
  orderCode: string;
  reportedAt: string;
  incidentType: string;
  description: string;
  evidencePhoto: string;
  gpsLocation: string;
  status: 'PENDING_REVIEW' | 'CONTINUE_TRIP' | 'REASSIGNED' | 'CANCELLED';
  dispatcherName?: string;
  dispatcherDecision?: string;
  dispatcherReason?: string;
  resolvedAt?: string;
}


export const DriverIncidentsPage: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { driverId } = useDriverContext();
  const orders = useAllOrders();
  const rawIncidents = useIncidents();
  /** UC-DRV-19: sự cố của các đơn tài xế đang/đã nhận, kèm quyết định của điều phối viên */
  const myOrderIds = new Set(orders.filter((o) => o.assignedDriver?.id === driverId).map((o) => o.id));
  const records: IncidentRecord[] = rawIncidents
    .filter((i) => i.reportedBy === 'Driver' && (i.reporterId === driverId || (!i.reporterId && myOrderIds.has(i.orderId))))
    .map((i) => ({
      id: i.id,
      orderCode: i.orderCode,
      reportedAt: formatDateTime(i.createdAt),
      incidentType: INCIDENT_TYPE_LABEL[i.type],
      description: i.description,
      evidencePhoto: i.photos[0] ?? '',
      gpsLocation: i.gps ? `${i.gps.lat.toFixed(4)}° N, ${i.gps.lng.toFixed(4)}° E` : 'Không có',
      status:
        i.status === 'Open' || i.status === 'InProgress'
          ? 'PENDING_REVIEW'
          : i.status === 'Cancelled' || i.decision === 'CancelOrder'
          ? 'CANCELLED'
          : i.decision === 'ReassignDriver'
          ? 'REASSIGNED'
          : 'CONTINUE_TRIP',
      dispatcherName: i.status === 'Open' ? undefined : 'Điều phối viên',
      dispatcherDecision: i.decision === 'ContinueTrip' ? 'Tiếp tục chuyến' : i.decision === 'ReassignDriver' ? 'Bàn giao cho tài xế khác' : i.decision === 'CancelOrder' ? 'Huỷ đơn' : i.status === 'Cancelled' ? 'Huỷ sự cố' : undefined,
      dispatcherReason: i.decisionNote,
      resolvedAt: i.resolvedAt ? formatDateTime(i.resolvedAt) : undefined,
    }));

  const filteredIncidents = records.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Nhật Ký Báo Cáo Sự Cố Trên Đường
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-xs">
                {filteredIncidents.length} sự cố
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Theo dõi tình trạng xử lý và quyết định hỗ trợ từ Trung tâm Điều phối đối với các sự cố bạn đã báo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:19006868"
              className="py-2 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-extrabold text-xs transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600" />
              <span>Hotline khẩn cấp: 1900 6868</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="max-w-[1680px] mx-auto w-full p-4 sm:p-6 space-y-4">
        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
            }`}
          >
            Tất cả sự cố ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CONTINUE_TRIP')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterStatus === 'CONTINUE_TRIP' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100'
            }`}
          >
            Tiếp tục hành trình
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('REASSIGNED')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterStatus === 'REASSIGNED' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
            }`}
          >
            Đã điều xe sang hàng
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterStatus === 'CANCELLED' ? 'bg-rose-600 text-white' : 'hover:bg-slate-100'
            }`}
          >
            Hủy chuyến & Bồi hoàn
          </button>
        </div>

        {/* List of Incidents */}
        <div className="space-y-3">
          {filteredIncidents.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                    Đơn hàng #{item.orderCode}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.reportedAt}
                  </span>

                  {item.status === 'CONTINUE_TRIP' && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Tiếp tục chạy
                    </span>
                  )}
                  {item.status === 'REASSIGNED' && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-blue-600" />
                      Đã điều xe khác hỗ trợ
                    </span>
                  )}
                  {item.status === 'CANCELLED' && (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Hủy đơn & Hoàn hàng
                    </span>
                  )}
                </div>

                <div className="font-black text-slate-800 text-sm">
                  {item.incidentType}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {item.description}
                </p>

                {item.dispatcherDecision && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <UserCheck className="w-4 h-4 text-brand-600" />
                      <span>{item.dispatcherName}:</span>
                      <span className="text-brand-600">{item.dispatcherDecision}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-5">
                      Ghi chú: {item.dispatcherReason}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Giải quyết lúc: {item.resolvedAt}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(item)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Xem hồ sơ sự cố</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Modal Xem Chi Tiết Sự Cố */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h3 className="font-black text-sm text-white">
                  Chi tiết sự cố đơn hàng #{selectedIncident.orderCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Loại sự cố:</span>
                <span className="font-black text-slate-900 text-sm">{selectedIncident.incidentType}</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Báo lúc: {selectedIncident.reportedAt}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Vị trí xe gặp sự cố:</span>
                <span className="font-extrabold text-slate-800">{selectedIncident.gpsLocation}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Mô tả chi tiết:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.evidencePhoto && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Ảnh bằng chứng hiện trường:</span>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-black max-h-48 flex items-center justify-center">
                    <img src={selectedIncident.evidencePhoto} alt="Ảnh sự cố" className="w-full h-full object-cover max-h-48" />
                  </div>
                </div>
              )}

              {/* Quyết định của Dispatcher */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quyết định từ {selectedIncident.dispatcherName}:</span>
                </div>
                <div className="font-extrabold text-emerald-700 text-sm">
                  {selectedIncident.dispatcherDecision}
                </div>
                <p className="text-[11px] text-slate-600">
                  Lý do: {selectedIncident.dispatcherReason}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-100">
                  Thời gian giải quyết: {selectedIncident.resolvedAt}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
