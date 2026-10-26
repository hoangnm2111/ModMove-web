import React, { useState } from 'react';
import { useDriverStore } from '../../store/useDriverStore';
import { JobAlertModal } from '../../features/driver/JobAlertModal';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { Button } from '../../components/Button';
import {
  Truck,
  Power,
  Navigation,
  Camera,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  PhoneCall,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { formatCurrency, formatDistance } from '../../utils/format';

export const DriverHomePage: React.FC = () => {
  const {
    isOnline,
    toggleOnline,
    activeTrip,
    tripStage,
    confirmArrivalAtPickup,
    confirmCargoLoaded,
    completeTrip,
    resetTrip,
    triggerJobOffer,
    todayEarnings,
    todayTripsCount,
    inspectionPhotos,
  } = useDriverStore();

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('Hỏng xe / nổ lốp');
  const [incidentReported, setIncidentReported] = useState(false);

  const handleReportIncident = () => {
    setIncidentReported(true);
    setTimeout(() => {
      setIncidentReported(false);
      setShowIncidentModal(false);
    }, 1500);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* 30-Second Job Offer Pop-up Modal */}
      <JobAlertModal />

      {/* Left Duty & Active Trip Control Panel */}
      <div className="w-[440px] bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10 flex-shrink-0">
        {/* Driver Status & Duty Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border-2 border-brand-500 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Tài xế"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Nguyễn Văn Hùng</div>
                <div className="text-[11px] text-slate-400">
                  Xe Tải 1 Tấn • <span className="text-brand-400 font-mono font-bold">29C-874.12</span>
                </div>
              </div>
            </div>

            {/* Online/Offline Toggle Button */}
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
                isOnline
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-4 ring-emerald-500/20'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isOnline ? 'ĐANG BẬT XE' : 'NGHỈ CUỐC'}</span>
            </button>
          </div>

          {/* Quick Stats Today */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/80 p-2 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Thu nhập hôm nay:</span>
              <span className="font-extrabold text-brand-400 text-sm">{formatCurrency(todayEarnings)}</span>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Số cuốc hoàn thành:</span>
              <span className="font-extrabold text-white text-sm">{todayTripsCount} chuyến</span>
            </div>
          </div>
        </div>

        {/* Work Area / Active Trip Card */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTrip ? (
            <div className="space-y-4">
              {/* Trip Code & Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CHUYẾN ĐANG CHẠY</div>
                  <div className="font-black text-slate-800 text-base">{activeTrip.code}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Thực nhận:</div>
                  <div className="font-black text-emerald-600 text-base">
                    +{formatCurrency(Math.round(activeTrip.totalFee * 0.8))}
                  </div>
                </div>
              </div>

              {/* Step Navigation Process */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Quy trình thực hiện chuyến hàng:
                </div>

                <div className="space-y-3">
                  {/* Phase 1 */}
                  <div
                    className={`flex items-start gap-2.5 text-xs ${
                      tripStage === 'NAVIGATING_PICKUP'
                        ? 'text-brand-600 font-bold'
                        : tripStage !== 'IDLE'
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        tripStage === 'NAVIGATING_PICKUP'
                          ? 'bg-brand-500 text-white font-bold animate-pulse'
                          : tripStage === 'IDLE'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {tripStage !== 'NAVIGATING_PICKUP' && tripStage !== 'IDLE' ? '✓' : '1'}
                    </div>
                    <div>
                      <div>Đến điểm bốc hàng (Pickup)</div>
                      <div className="text-[11px] text-slate-500 font-normal">{activeTrip.pickup.address}</div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div
                    className={`flex items-start gap-2.5 text-xs ${
                      tripStage === 'CARGO_INSPECTION'
                        ? 'text-brand-600 font-bold'
                        : ['IN_TRANSIT', 'POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage)
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        tripStage === 'CARGO_INSPECTION'
                          ? 'bg-brand-500 text-white font-bold animate-pulse'
                          : ['IN_TRANSIT', 'POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {['IN_TRANSIT', 'POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage) ? '✓' : '2'}
                    </div>
                    <div>
                      <div>Kiểm tra & Chụp ảnh đối chứng hàng hóa</div>
                      <div className="text-[11px] text-slate-500 font-normal">Chụp tối thiểu 2 ảnh hàng trước khi rời đi</div>
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div
                    className={`flex items-start gap-2.5 text-xs ${
                      tripStage === 'IN_TRANSIT'
                        ? 'text-brand-600 font-bold'
                        : ['POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage)
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        tripStage === 'IN_TRANSIT'
                          ? 'bg-sky-600 text-white font-bold animate-pulse'
                          : ['POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {['POD_DELIVERY', 'TRIP_COMPLETED'].includes(tripStage) ? '✓' : '3'}
                    </div>
                    <div>
                      <div>Vận chuyển tới điểm giao (In-Transit)</div>
                      <div className="text-[11px] text-slate-500 font-normal">{activeTrip.dropoff.address}</div>
                    </div>
                  </div>

                  {/* Phase 4 */}
                  <div
                    className={`flex items-start gap-2.5 text-xs ${
                      tripStage === 'POD_DELIVERY' || tripStage === 'TRIP_COMPLETED'
                        ? 'text-brand-600 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        tripStage === 'TRIP_COMPLETED'
                          ? 'bg-emerald-500 text-white'
                          : tripStage === 'POD_DELIVERY'
                          ? 'bg-brand-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tripStage === 'TRIP_COMPLETED' ? '✓' : '4'}
                    </div>
                    <div>
                      <div>Giao hàng & Chụp biên bản bàn giao (POD)</div>
                      <div className="text-[11px] text-slate-500 font-normal">Chụp ảnh hàng đã dỡ xuống an toàn</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Depending on Trip Stage */}
              <div className="space-y-3 pt-2">
                {tripStage === 'NAVIGATING_PICKUP' && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={confirmArrivalAtPickup}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <MapPin className="w-4 h-4 mr-1.5" /> TÔI ĐÃ ĐẾN ĐIỂM LẤY HÀNG (UC-DRV-12)
                  </Button>
                )}

                {tripStage === 'CARGO_INSPECTION' && (
                  <div className="space-y-3 p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200">
                    <div className="text-xs font-bold text-slate-800">Ảnh kiểm tra hàng hóa trước khi bốc:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {inspectionPhotos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt="Ảnh hàng"
                          className="w-full h-24 object-cover rounded-xl border border-orange-200 shadow-sm"
                        />
                      ))}
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={confirmCargoLoaded}
                      className="w-full bg-brand-500 hover:bg-brand-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> XÁC NHẬN ĐÃ BỐC HÀNG XONG (UC-DRV-13)
                    </Button>
                  </div>
                )}

                {tripStage === 'IN_TRANSIT' && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => useDriverStore.setState({ tripStage: 'POD_DELIVERY' })}
                    className="w-full bg-sky-600 hover:bg-sky-700"
                  >
                    <Navigation className="w-4 h-4 mr-1.5" /> TÔI ĐÃ TỚI NƠI GIAO HÀNG
                  </Button>
                )}

                {tripStage === 'POD_DELIVERY' && (
                  <div className="space-y-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <div className="text-xs font-bold text-slate-800">Chụp ảnh bàn giao (Proof of Delivery):</div>
                    <div className="h-28 rounded-xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center bg-white text-emerald-700 text-xs">
                      <Camera className="w-6 h-6 mb-1 text-emerald-600" />
                      <span>Đã đính kèm ảnh bàn giao tại sảnh nhận</span>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={completeTrip}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> HOÀN TẤT CHUYẾN XE (UC-DRV-14)
                    </Button>
                  </div>
                )}

                {tripStage === 'TRIP_COMPLETED' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div className="font-black text-slate-900 text-base">Chuyến xe hoàn thành xuất sắc!</div>
                    <div className="text-xs text-slate-600">
                      Tiền cước đã được cộng trực tiếp vào Ví tài xế của bạn:
                    </div>
                    <div className="text-xl font-black text-emerald-600">
                      +{formatCurrency(Math.round(activeTrip.totalFee * 0.8))}
                    </div>
                    <Button variant="outline" size="sm" onClick={resetTrip} className="mt-2">
                      Tiếp tục nhận cuốc mới
                    </Button>
                  </div>
                )}

                {/* Emergency In-transit Incident Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(true)}
                    className="w-full py-2 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Báo cáo sự cố khẩn cấp trên đường (UC-DRV-19)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-brand-500 mx-auto flex items-center justify-center animate-pulse">
                <Truck className="w-8 h-8" />
              </div>
              <div className="font-extrabold text-slate-800 text-base">Hiện không có cuốc xe đang chạy</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Hãy giữ trạng thái BẬT XE. Hệ thống sẽ tự động gửi thông báo điều phối khi khách hàng xung quanh đặt đơn.
              </p>
              <Button variant="primary" size="sm" onClick={() => triggerJobOffer()}>
                Giả lập nhận cuốc xe điều phối mới (Demo)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Realtime Navigation Map */}
      <div className="flex-1 h-full relative">
        <MapPlaceholder
          pickup={activeTrip?.pickup}
          dropoff={activeTrip?.dropoff}
          showActiveDrivers={true}
        />
      </div>

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" /> Báo cáo sự cố vận chuyển
            </h3>

            {incidentReported ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs text-center font-bold">
                ✓ Đã gửi báo cáo thành công tới Trung tâm Điều phối (Dispatcher). Điều phối viên đang liên hệ hỗ trợ bạn!
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại sự cố:</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50"
                  >
                    <option>Hỏng xe / nổ lốp / trục trặc động cơ</option>
                    <option>Hàng cồng kềnh vượt quá khai báo ban đầu</option>
                    <option>Va chạm giao thông / Tắc đường bất khả kháng</option>
                    <option>Khách hàng từ chối nhận đồ tại điểm giao</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ảnh hiện trường:</label>
                  <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 text-center text-slate-500 cursor-pointer">
                    <Camera className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    Chụp ảnh vị trí xe và hàng hóa
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowIncidentModal(false)}>
                    Hủy
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleReportIncident}>
                    Gửi sự cố tới Dispatcher
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
