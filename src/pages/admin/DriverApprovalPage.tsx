import React, { useState } from 'react';
import { ShieldCheck, Check, X, Eye, FileText, Truck, Calendar } from 'lucide-react';
import { Button } from '../../components/Button';
import { DriverApplication } from '../../types/user.types';

const MOCK_APPLICATIONS: DriverApplication[] = [
  {
    id: 'app_01',
    fullName: 'Vũ Đức Thịnh',
    phoneNumber: '0971234567',
    email: 'thinhvu@gmail.com',
    nationalId: '001201004567',
    licenseNumber: 'B2-88219482',
    licensePhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    registrationPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    inspectionPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    vehiclePhotoUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
    vehicleCategory: 'Xe Tải Nhỏ 1 Tấn',
    payloadCapacityKg: 990,
    boxDimensions: '3.1 x 1.6 x 1.7 m (Thùng kín)',
    licensePlate: '29C-998.54',
    submittedAt: 'Hôm nay, 14:20',
    status: 'Pending',
  },
  {
    id: 'app_02',
    fullName: 'Hoàng Hải Nam',
    phoneNumber: '0988112233',
    email: 'namhoang@gmail.com',
    nationalId: '001202008899',
    licenseNumber: 'C-10294812',
    licensePhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    registrationPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    inspectionPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    vehiclePhotoUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    vehicleCategory: 'Xe Tải 2 Tấn',
    payloadCapacityKg: 1950,
    boxDimensions: '4.2 x 1.8 x 1.9 m',
    licensePlate: '30F-441.20',
    submittedAt: 'Hôm qua, 09:15',
    status: 'Approved',
  },
];

export const DriverApprovalPage: React.FC = () => {
  const [apps, setApps] = useState<DriverApplication[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<DriverApplication>(MOCK_APPLICATIONS[0]);
  const [activePhoto, setActivePhoto] = useState<string>(selectedApp.licensePhotoUrl);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = () => {
    setApps((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'Approved' } : a))
    );
    setSelectedApp((prev) => ({ ...prev, status: 'Approved' }));
  };

  const handleReject = () => {
    setApps((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'Rejected', rejectionReason: rejectReason } : a))
    );
    setSelectedApp((prev) => ({ ...prev, status: 'Rejected', rejectionReason: rejectReason }));
    setShowRejectModal(false);
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Left List of Applications */}
      <div className="w-[380px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="font-extrabold text-sm text-slate-800">Thẩm định hồ sơ đối tác tài xế</h1>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
            {apps.filter((a) => a.status === 'Pending').length} chờ duyệt
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {apps.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setSelectedApp(a);
                setActivePhoto(a.licensePhotoUrl);
              }}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                selectedApp.id === a.id
                  ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800">{a.fullName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    a.status === 'Pending'
                      ? 'bg-amber-100 text-amber-700'
                      : a.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {a.status === 'Pending' ? 'Chờ thẩm định' : a.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">{a.vehicleCategory} • {a.licensePlate}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Nộp lúc: {a.submittedAt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Document Inspection Console */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-800">{selectedApp.fullName} ({selectedApp.phoneNumber})</h2>
              <div className="text-xs text-slate-500 mt-0.5">CCCD: {selectedApp.nationalId} • Giấy phép lái xe: {selectedApp.licenseNumber}</div>
            </div>

            <div className="flex items-center gap-2">
              {selectedApp.status === 'Pending' ? (
                <>
                  <Button variant="danger" size="md" onClick={() => setShowRejectModal(true)}>
                    <X className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                  <Button variant="primary" size="md" onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-4 h-4 mr-1" /> Duyệt hồ sơ (Active)
                  </Button>
                </>
              ) : (
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    selectedApp.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  Trạng thái: {selectedApp.status === 'Approved' ? 'Đã cấp quyền trực tuyến' : 'Hồ sơ đã bị từ chối'}
                </span>
              )}
            </div>
          </div>

          {/* Vehicle Specifications Verification */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">BIỂN SỐ ĐĂNG KÝ:</span>
              <span className="font-extrabold text-slate-800 font-mono text-sm">{selectedApp.licensePlate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TẢI TRỌNG CHO PHÉP:</span>
              <span className="font-bold text-slate-800">{selectedApp.payloadCapacityKg} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">KÍCH THƯỚC THÙNG XE:</span>
              <span className="font-bold text-slate-800">{selectedApp.boxDimensions}</span>
            </div>
          </div>

          {/* High Resolution Document Viewer with Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Giấy tờ pháp lý & Ảnh chụp xe (Click để xem phóng to):
            </div>
            <div className="flex gap-2 mb-3">
              {[
                { label: 'Giấy phép lái xe', url: selectedApp.licensePhotoUrl },
                { label: 'Đăng ký xe (Cà vẹt)', url: selectedApp.registrationPhotoUrl },
                { label: 'Sổ kiểm định', url: selectedApp.inspectionPhotoUrl },
                { label: 'Ảnh thực tế xe tải', url: selectedApp.vehiclePhotoUrl },
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(tab.url)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activePhoto === tab.url
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center h-80">
              <img src={activePhoto} alt="Document Zoom" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Nhập lý do từ chối hồ sơ tài xế</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Ảnh bằng lái mờ góc số, sổ kiểm định đã quá hạn..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>Hủy</Button>
              <Button variant="danger" size="sm" onClick={handleReject}>Xác nhận từ chối</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
