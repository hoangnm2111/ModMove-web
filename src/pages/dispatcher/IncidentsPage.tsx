import React, { useState } from 'react';
import { AlertTriangle, Repeat, CheckCircle, Clock, ShieldAlert, PhoneCall } from 'lucide-react';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../utils/format';

interface IncidentTicket {
  id: string;
  orderCode: string;
  driverName: string;
  driverPhone: string;
  type: string;
  description: string;
  evidencePhoto: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVING' | 'RESOLVED';
  reportedAt: string;
}

const MOCK_INCIDENTS: IncidentTicket[] = [
  {
    id: 'inc_01',
    orderCode: 'MM-78219',
    driverName: 'Nguyễn Văn Hùng',
    driverPhone: '0912345678',
    type: 'Sự cố xe hỏng lốp giữa đường',
    description: 'Xe tải 1 tấn bị nổ lốp tại đường gom Đại lộ Thăng Long, cần điều xe khác bốc hàng sang để kịp tiến độ.',
    evidencePhoto: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    severity: 'HIGH',
    status: 'OPEN',
    reportedAt: '15 phút trước',
  },
  {
    id: 'inc_02',
    orderCode: 'MM-78220',
    driverName: 'Lê Thanh Bình',
    driverPhone: '0977889900',
    type: 'Hàng hóa cồng kềnh quá tải so với khai báo',
    description: 'Khách hàng có thêm 1 tủ kính lớn không khai báo trước, nguy cơ va đập vỡ.',
    evidencePhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    severity: 'MEDIUM',
    status: 'RESOLVING',
    reportedAt: '40 phút trước',
  },
];

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentTicket[]>(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<IncidentTicket>(MOCK_INCIDENTS[0]);
  const [isReassigning, setIsReassigning] = useState(false);

  const handleReassign = () => {
    setIsReassigning(true);
    setTimeout(() => {
      setIsReassigning(false);
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === selectedIncident.id ? { ...inc, status: 'RESOLVED' } : inc))
      );
      setSelectedIncident((prev) => ({ ...prev, status: 'RESOLVED' }));
    }, 1200);
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Left List of Incidents */}
      <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h1 className="font-extrabold text-sm text-slate-800">Console Xử lý Sự cố & Điều phối</h1>
          </div>
          <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
            {incidents.filter((i) => i.status !== 'RESOLVED').length} mở
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                selectedIncident.id === inc.id
                  ? 'border-rose-500 bg-rose-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-xs text-slate-800">{inc.orderCode}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    inc.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {inc.severity === 'HIGH' ? 'Mức độ cao' : 'Trung bình'}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-700">{inc.type}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{inc.description}</div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tài xế: {inc.driverName}</span>
                <span>{inc.reportedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Incident Details & Emergency Action Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="text-xs font-bold text-rose-600 uppercase">Mã đơn: {selectedIncident.orderCode}</div>
              <h2 className="text-lg font-black text-slate-800 mt-0.5">{selectedIncident.type}</h2>
              <div className="text-xs text-slate-500 mt-1">Báo cáo: {selectedIncident.reportedAt} bởi {selectedIncident.driverName}</div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                selectedIncident.status === 'RESOLVED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700 animate-pulse'
              }`}
            >
              {selectedIncident.status === 'RESOLVED' ? 'Đã giải quyết xong' : 'Đang xử lý khẩn cấp'}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Bằng chứng hiện trường:</div>
            <img
              src={selectedIncident.evidencePhoto}
              alt="Hiện trường"
              className="w-full h-56 object-cover rounded-xl border border-slate-200"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800">Chi tiết mô tả sự cố:</div>
            <p className="text-slate-600 leading-relaxed">{selectedIncident.description}</p>
            <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
              <span className="font-medium text-slate-700">Liên hệ tài xế: {selectedIncident.driverPhone}</span>
              <Button variant="outline" size="sm">
                <PhoneCall className="w-3.5 h-3.5 mr-1" /> Gọi ngay
              </Button>
            </div>
          </div>

          {/* Action Options */}
          {selectedIncident.status !== 'RESOLVED' ? (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="font-bold text-xs text-slate-800 uppercase">Hành động khắc phục sự cố (Dispatcher Actions):</div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isReassigning}
                  onClick={handleReassign}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  <Repeat className="w-4 h-4 mr-1.5" /> Điều phối xe khác thay thế (UC-DIS-08)
                </Button>
                <Button variant="outline" size="md">
                  Tiếp tục sau khi sửa xong
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Đơn hàng đã được chuyển giao thành công sang tài xế dự phòng. Lộ trình tiếp tục bình thường.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
