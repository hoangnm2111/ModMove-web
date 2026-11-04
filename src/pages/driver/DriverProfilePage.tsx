import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  Star,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  FileText,
  Calendar,
  AlertCircle,
  ExternalLink,
  Upload,
  Camera,
  AlertTriangle,
  Clock,
  RotateCcw,
  Check,
  Eye,
  Info
} from 'lucide-react';
import { toast } from '../../components/ui/feedback';
import { msg } from '../../constants/messages';
import { useDriverContext } from '../../hooks/useDriverContext';
import { useVehicleTypes } from '../../hooks/useDomainData';
import { driverService } from '../../services/driver.service';
import { errorMessage } from '../../services/mock/storage';

export const DriverProfilePage: React.FC = () => {
  const { user, driverId, application, approvalStatus: profileApprovalStatus } = useDriverContext();
  const rejectionReason = application?.rejectionReason ?? '';
  const vehicleTypes = useVehicleTypes();
  /** UC-DRV-03/05: chỉ sửa & nộp khi chưa nộp hoặc bị từ chối (mỗi lúc 1 phiên bản Pending) */
  const canEdit = profileApprovalStatus === 'Draft' || profileApprovalStatus === 'Rejected';

  // Form states for uploading / updating documents
  const [vehicleCategory, setVehicleCategory] = useState(application?.vehicleCategory ?? 'vt_truck_1t');
  const [licensePlate, setLicensePlate] = useState(application?.licensePlate ?? '');
  const [payloadKg, setPayloadKg] = useState(String(application?.payloadCapacityKg ?? ''));
  const [boxDimensions, setBoxDimensions] = useState(application?.boxDimensions ?? '');
  const [nationalId, setNationalId] = useState(application?.nationalId ?? '');
  const [licenseNumber, setLicenseNumber] = useState(application?.licenseNumber ?? '');

  // Document photo states (URLs)
  const [gplxPhoto, setGplxPhoto] = useState(application?.licensePhotoUrl ?? '');
  const [cccdPhoto, setCccdPhoto] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
  );
  const [cavetPhoto, setCavetPhoto] = useState(application?.registrationPhotoUrl ?? '');
  const [dangKiemPhoto, setDangKiemPhoto] = useState(application?.inspectionPhotoUrl ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // File upload simulator handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit documents for Admin Review
  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await driverService.submitApplication(driverId, {
        nationalId: nationalId.trim(),
        licenseNumber: licenseNumber.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        licensePhotoUrl: gplxPhoto,
        registrationPhotoUrl: cavetPhoto,
        inspectionPhotoUrl: dangKiemPhoto,
        vehiclePhotoUrl: application?.vehiclePhotoUrl || dangKiemPhoto, // thẻ 4: đăng kiểm & ảnh xe
        vehicleCategory,
        payloadCapacityKg: Number(payloadKg) || 0,
      });
      toast.success(msg('MSG23'));
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 1. Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Hồ Sơ Đối Tác Tài Xế & Thẩm Định Pháp Lý
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Thông tin xác thực danh tính, giấy phép lái xe và phân hạng phương tiện hoạt động theo quy chuẩn
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Container */}
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-[1680px] w-full mx-auto space-y-5">
        
        {/* ========================================================================= */}
        {/* TRẠNG THÁI 1: BỊ TỪ CHỐI (REJECTED) - CẢNH BÁO ĐỎ & HƯỚNG DẪN NỘP LẠI */}
        {/* ========================================================================= */}
        {profileApprovalStatus === 'Rejected' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 text-rose-900 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-base text-rose-800">
                    Hồ sơ đăng ký của bạn bị từ chối phê duyệt
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold text-[10px]">
                    Tạm khóa nhận đơn
                  </span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  <strong>Lý do từ chối từ Ban Quản Trị:</strong> "{rejectionReason}"
                </p>
                <p className="text-[11px] text-rose-600">
                  Vui lòng kiểm tra lại ảnh chụp các giấy tờ chưa đạt tiêu chuẩn bên dưới, chụp tải lại ảnh mới rõ nét và bấm <strong>"Gửi thẩm định lại"</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TRẠNG THÁI 2: ĐANG CHỜ DUYỆT (PENDING) - THÔNG BÁO VÀNG */}
        {/* ========================================================================= */}
        {profileApprovalStatus === 'Pending' && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 text-amber-900 shadow-sm flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-amber-800">
                  Hồ sơ đang trong quá trình thẩm định (Pending)
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Ban Quản trị ModMove đang đối chiếu thông tin GPLX và Đăng kiểm xe của bạn. Kết quả phê duyệt sẽ có trong vòng 24 giờ.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200/80 text-amber-900 font-black text-xs rounded-xl flex-shrink-0">
              Đang chờ Admin duyệt
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TRẠNG THÁI 3: CHƯA NỘP HỒ SƠ (DRAFT) - BANNER XANH DƯƠNG HƯỚNG DẪN */}
        {/* ========================================================================= */}
        {profileApprovalStatus === 'Draft' && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-blue-900 shadow-sm flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-blue-900">
                  Hoàn thiện hồ sơ đối tác để bắt đầu nhận cuốc xe
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Tài khoản của bạn đã được đăng ký thành công. Vui lòng hoàn thành thông tin xe và tải lên các ảnh giấy tờ pháp lý bên dưới.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 font-black text-xs rounded-xl flex-shrink-0">
              Chưa nộp hồ sơ
            </span>
          </div>
        )}

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Driver Info & Ratings */}
          <div className="lg:col-span-5 space-y-4">
            {/* Profile Avatar Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Avatar tài xế"
                  className="w-16 h-16 rounded-2xl border-2 border-brand-500 object-cover shadow-sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">Nguyễn Văn Hùng</h2>
                    {profileApprovalStatus === 'Approved' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                        ✓ Đã duyệt
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                        Chưa kích hoạt
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">Mã tài xế: DRV-88219</div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> 4.9 / 5.0
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium">248 đánh giá</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">SỐ ĐIỆN THOẠI:</span>
                  <span className="font-extrabold text-slate-800">0912 345 678</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">NGÀY THAM GIA:</span>
                  <span className="font-extrabold text-slate-800">15/08/2026</span>
                </div>
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Chỉ số hoạt động & Uy tín
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block">Tỷ lệ nhận đơn</span>
                  <span className="font-black text-emerald-700 text-base">98.5%</span>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100">
                  <span className="text-slate-500 text-[10px] block">Số cuốc hoàn thành</span>
                  <span className="font-black text-brand-700 text-base">142</span>
                </div>
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <span className="text-slate-500 text-[10px] block">Tỷ lệ đúng giờ</span>
                  <span className="font-black text-sky-700 text-base">99.1%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Vehicle & Legal Documents Upload Form */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSubmitDocuments} className="space-y-4">
              {/* Vehicle Specs Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand-600" />
                    <h3 className="font-black text-sm text-slate-900">
                      Thông số phương tiện đăng ký
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs">
                    {licensePlate}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                      CHỦNG LOẠI XE:
                    </label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value)}
                      disabled={!canEdit}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                    >
                      {vehicleTypes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                      BIỂN SỐ XE:
                    </label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      disabled={!canEdit}
                      placeholder="VD: 29C-874.12"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                      TẢI TRỌNG CHO PHÉP (KG):
                    </label>
                    <input
                      type="number"
                      value={payloadKg}
                      onChange={(e) => setPayloadKg(e.target.value)}
                      disabled={!canEdit}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                      KÍCH THƯỚC THÙNG (D x R x C):
                    </label>
                    <input
                      type="text"
                      value={boxDimensions}
                      onChange={(e) => setBoxDimensions(e.target.value)}
                      disabled={!canEdit}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Loại Giấy Tờ Pháp Lý Upload Thực Tế */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <span>4 Giấy tờ thẩm định bắt buộc (Chụp tải ảnh)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Định dạng JPG, PNG</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slot 1: GPLX */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">1. Giấy phép lái xe (GPLX)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        Hạng C
                      </span>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                      <img src={gplxPhoto} alt="GPLX" className="w-full h-full object-cover" />
                      {canEdit && (
                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold">
                          <Camera className="w-4 h-4" />
                          <span>Chụp / Thay ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setGplxPhoto)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Slot 2: CCCD */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">2. Căn cước công dân (CCCD)</span>
                      <span className="text-[10px] text-slate-500 font-mono">001201004567</span>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                      <img src={cccdPhoto} alt="CCCD" className="w-full h-full object-cover" />
                      {canEdit && (
                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold">
                          <Camera className="w-4 h-4" />
                          <span>Chụp / Thay ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setCccdPhoto)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Slot 3: Cà vẹt Đăng ký xe */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">3. Giấy đăng ký xe (Cà vẹt)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        Chính chủ
                      </span>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                      <img src={cavetPhoto} alt="Cà vẹt" className="w-full h-full object-cover" />
                      {canEdit && (
                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold">
                          <Camera className="w-4 h-4" />
                          <span>Chụp / Thay ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setCavetPhoto)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Slot 4: Sổ Đăng kiểm xe */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">4. Sổ đăng kiểm & Ảnh xe</span>
                      {profileApprovalStatus === 'Rejected' ? (
                        <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-black">
                          Cần chụp lại!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">Hạn: 12/2027</span>
                      )}
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                      <img src={dangKiemPhoto} alt="Sổ đăng kiểm" className="w-full h-full object-cover" />
                      {canEdit && (
                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold">
                          <Camera className="w-4 h-4" />
                          <span>Chụp / Thay ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setDangKiemPhoto)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút nộp hồ sơ / nộp lại nếu bị từ chối */}
                {canEdit && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500">
                      Đảm bảo các ảnh chụp đủ góc cạnh, rõ ràng chữ số và còn hạn sử dụng.
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-md shadow-orange-500/25 transition cursor-pointer flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Đang tải lên...</span>
                      ) : profileApprovalStatus === 'Rejected' ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>NỘP LẠI HỒ SƠ XÉT DUYỆT</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>GỬI HỒ SƠ CHO BAN QUẢN TRỊ DUYỆT</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
