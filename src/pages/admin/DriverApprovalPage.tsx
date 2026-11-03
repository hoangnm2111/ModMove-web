import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  FileText,
  Truck,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Info,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { confirm, toast } from '../../components/ui/feedback';
import { msg } from '../../constants/messages';
import { useLiveData } from '../../hooks/useLiveData';
import { useVehicleTypes } from '../../hooks/useDomainData';
import { driverService, DriverApplicationRecord } from '../../services/driver.service';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime } from '../../utils/format';

/** SCR-33/34 – Thẩm định hồ sơ tài xế (UC-ADM-08, UC-ADM-09) */
export const DriverApprovalPage: React.FC = () => {
  const [apps] = useLiveData(driverService.listLatestApplicationsSync, driverService.subscribe);
  const vehicleTypes = useVehicleTypes();
  const vehicleName = (id: string) => vehicleTypes.find((v) => v.id === id)?.name ?? id;

  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomModalPhoto, setZoomModalPhoto] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedApp: DriverApplicationRecord | undefined = apps.find((a) => a.id === selectedId) ?? apps[0];
  const [activePhoto, setActivePhoto] = useState<string>(selectedApp?.licensePhotoUrl ?? '');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const setSelectedApp = (a: DriverApplicationRecord) => {
    setSelectedId(a.id);
    setActivePhoto(a.licensePhotoUrl);
  };

  /** MSG62 → MSG24 */
  const handleApprove = async () => {
    if (!selectedApp) return;
    if (!(await confirm({ title: 'Duyệt hồ sơ', message: msg('MSG62', { action_name: `duyệt hồ sơ ${selectedApp.fullName} (v${selectedApp.version})` }) }))) return;
    try {
      await driverService.approve(selectedApp.id);
      toast.success(msg('MSG24', { status: 'phê duyệt', additional_information: 'Tài xế có thể bật trực tuyến.' }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    try {
      await driverService.reject(selectedApp.id, rejectReasonInput);
      toast.success(msg('MSG24', { status: 'từ chối', additional_information: rejectReasonInput }));
      setShowRejectModal(false);
      setRejectReasonInput('');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!selectedApp) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Chưa có hồ sơ tài xế nào.</div>;
  }

  // Filter applications list
  const filteredApps = apps.filter((a) => {
    const matchesFilter =
      activeTabFilter === 'ALL'
        ? true
        : activeTabFilter === 'PENDING'
        ? a.status === 'Pending'
        : activeTabFilter === 'APPROVED'
        ? a.status === 'Approved'
        : a.status === 'Rejected';

    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phoneNumber.includes(searchTerm) ||
      a.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: APPLICATION QUEUE & FILTER LIST */}
      {/* ========================================================================= */}
      <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 shadow-sm z-10">
        {/* Header with Title & Stats */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-black text-sm text-slate-800">Thẩm định hồ sơ đối tác</h1>
                <p className="text-[11px] text-slate-400">Kiểm duyệt pháp lý & Phương tiện</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded-full">
              {apps.filter((a) => a.status === 'Pending').length} chờ duyệt
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SĐT, biển số xe..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>

          {/* Status Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-center">
            {[
              { id: 'PENDING', label: 'Chờ duyệt' },
              { id: 'APPROVED', label: 'Đã duyệt' },
              { id: 'REJECTED', label: 'Từ chối' },
              { id: 'ALL', label: 'Tất cả' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabFilter(tab.id as typeof activeTabFilter)}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  activeTabFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Applications */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Không có hồ sơ nào thỏa mãn</p>
            </div>
          ) : (
            filteredApps.map((a) => {
              const isSelected = selectedApp.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedApp(a);
                    setActivePhoto(a.licensePhotoUrl);
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200/90 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 truncate">
                      <span>{a.fullName}</span>
                      {a.version > 1 && (
                        <span className="text-[10px] bg-sky-100 text-sky-700 font-extrabold px-1.5 py-0.5 rounded">Nộp lại</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        a.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : a.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : a.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {a.status === 'Pending'
                        ? 'Chờ duyệt'
                        : a.status === 'Approved'
                        ? 'Đã duyệt'
                        : a.status === 'Rejected'
                        ? 'Từ chối'
                        : 'Bản nháp'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                    <span>{vehicleName(a.vehicleCategory)} • v{a.version}</span>
                    <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      {a.licensePlate}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {a.phoneNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDateTime(a.submittedAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: DETAILED VERIFICATION & AUDIT WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Driver Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md flex-shrink-0">
                  {selectedApp.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{selectedApp.fullName}</h2>
                                      </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Số điện thoại: <strong className="text-slate-800">{selectedApp.phoneNumber}</strong></span>
                    <span>CCCD: <strong className="text-slate-800 font-mono">{selectedApp.nationalId}</strong></span>
                    <span>Số GPLX: <strong className="text-slate-800 font-mono">{selectedApp.licenseNumber}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedApp.status === 'Pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ chối hồ sơ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Phê duyệt ngay (Mở quyền nhận đơn)</span>
                    </button>
                  </>
                ) : selectedApp.status === 'Approved' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Hồ sơ đã được phê duyệt đầy đủ</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Phiên bản đã quyết định không thể thay đổi</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Hồ sơ đang bị từ chối</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Chờ tài xế nộp lại phiên bản mới (UC-DRV-05)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection notice banner if rejected */}
            {selectedApp.status === 'Rejected' && selectedApp.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-xs text-rose-900">Lý do từ chối gửi tới tài xế:</div>
                  <div className="text-xs text-rose-700 mt-0.5">{selectedApp.rejectionReason}</div>
                </div>
              </div>
            )}

            {/* Vehicle Specifications Verification Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">HẠNG XE ĐĂNG KÝ</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">{vehicleName(selectedApp.vehicleCategory)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">BIỂN SỐ XE</span>
                <span className="font-black text-slate-900 font-mono text-sm mt-0.5 block">{selectedApp.licensePlate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">TẢI TRỌNG CHO PHÉP</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedApp.payloadCapacityKg} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">KÍCH THƯỚC THÙNG (D x R x C)</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedApp.boxDimensions}</span>
              </div>
            </div>

            {/* Document Verification Gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Giấy tờ pháp lý bắt buộc (4 mục)
                </span>
                <span className="text-[11px] text-slate-400">
                  Chọn để soi chiếu ảnh độ nét cao
                </span>
              </div>

              {/* Gallery selection tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'gplx', label: '1. Bằng lái xe (GPLX)', url: selectedApp.licensePhotoUrl },
                  { id: 'cavet', label: '2. Đăng ký xe (Cà vẹt)', url: selectedApp.registrationPhotoUrl },
                  { id: 'kiemdinh', label: '3. Sổ đăng kiểm xe', url: selectedApp.inspectionPhotoUrl },
                  { id: 'xe', label: '4. Ảnh thực tế xe & biển số', url: selectedApp.vehiclePhotoUrl },
                ].map((item) => {
                  const isCurrent = activePhoto === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePhoto(item.url)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px] line-clamp-1">{item.label}</span>
                      <div className="h-16 w-full rounded-xl overflow-hidden mt-2 bg-slate-950/10 relative">
                        <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-slate-950" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Photo Display Viewport with Zoom */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center h-96 group shadow-inner">
                <img
                  src={activePhoto}
                  alt="Ảnh giấy tờ phóng to"
                  className="max-h-full max-w-full object-contain transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setZoomModalPhoto(activePhoto)}
                  className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition shadow-lg cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Phóng to toàn màn hình</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REJECT MODAL: Input reasons with templates */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Từ chối hồ sơ đối tác tài xế</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do cụ thể để tài xế <strong>{selectedApp.fullName}</strong> có thể xem và chụp lại đúng yêu cầu:
            </p>

            {/* Fast suggestion chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Ảnh bằng lái xe bị mờ / chói sáng',
                'Hạng GPLX chưa phù hợp với xe tải',
                'Sổ kiểm định xe đã hết hạn hiệu lực',
                'Biển số xe trên ảnh không khớp đăng ký',
              ].map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReasonInput(reason)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                Xác nhận từ chối & Gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO PREVIEW MODAL */}
      {zoomModalPhoto && (
        <div
          onClick={() => setZoomModalPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 p-6 flex flex-col items-center justify-center cursor-zoom-out backdrop-blur-md animate-fadeIn"
        >
          <div className="absolute top-6 right-6">
            <button
              onClick={() => setZoomModalPhoto(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={zoomModalPhoto}
            alt="Full Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
