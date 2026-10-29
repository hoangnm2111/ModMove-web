import React, { useState, useEffect } from 'react';
import { useDriverStore, DriverTripStage } from '../../store/useDriverStore';
import { orderService } from '../../services/order.service';
import { ShippingOrder, OrderStatus } from '../../types/order.types';
import { JobAlertModal } from '../../features/driver/JobAlertModal';
import { formatCurrency, formatDistance } from '../../utils/format';
import {
  Truck,
  Power,
  Navigation,
  Camera,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  PhoneCall,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Package,
  ZoomIn,
  Check,
  CheckCheck,
  Upload,
  MessageSquare,
  AlertCircle,
  Radio,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Coins,
  FileText,
  User,
} from 'lucide-react';
import { useDriverLayout } from '../../layouts/DriverLayout';

// Driver Milestones strictly mapped to SRS Lifecycle:
// 1. Accepted (Heading to pickup)
// 2. Arrived (Arrived at pickup, inspecting cargo)
// 3. PickedUp (Evidence uploaded, waiting for customer approval)
// 4. InTransit (Customer approved, navigating to destination)
// 5. Delivered (Arrived at destination, uploaded POD, confirmed COD)
interface DriverMilestone {
  stage: DriverTripStage;
  orderStatus: OrderStatus;
  title: string;
  subTitle: string;
  actionText: string;
}

const DRIVER_MILESTONES: DriverMilestone[] = [
  {
    stage: 'NAVIGATING_PICKUP',
    orderStatus: 'Accepted',
    title: '1. Đến điểm lấy hàng',
    subTitle: 'Di chuyển theo bản đồ chỉ đường tới địa chỉ người gửi',
    actionText: 'TÔI ĐÃ ĐẾN ĐIỂM LẤY HÀNG',
  },
  {
    stage: 'CARGO_INSPECTION',
    orderStatus: 'Arrived',
    title: '2. Kiểm tra & Chụp ảnh bốc hàng',
    subTitle: 'Chụp tối thiểu 2 ảnh hiện trạng hàng & đối soát số lượng kiện',
    actionText: 'XÁC NHẬN BỐC HÀNG & GỬI DUYỆT',
  },
  {
    stage: 'IN_TRANSIT',
    orderStatus: 'InTransit',
    title: '3. Đang vận chuyển tới điểm giao',
    subTitle: 'Khách hàng đã phê duyệt. Bắt đầu di chuyển tới điểm giao',
    actionText: 'TÔI ĐÃ ĐẾN ĐIỂM GIAO HÀNG',
  },
  {
    stage: 'POD_DELIVERY',
    orderStatus: 'Delivered',
    title: '4. Bàn giao & Chụp ảnh nhận hàng',
    subTitle: 'Chụp ảnh bàn giao, thu tiền mặt COD (nếu có) và hoàn tất',
    actionText: 'HOÀN THÀNH ĐƠN HÀNG',
  },
];

export const DriverHomePage: React.FC = () => {
  const { toggleSidebar } = useDriverLayout();
  const {
    isOnline,
    toggleOnline,
    activeTrip,
    tripStage,
    setTripStage,
    confirmArrivalAtPickup,
    confirmCargoLoaded,
    completeTrip,
    resetTrip,
    triggerJobOffer,
    todayEarnings,
    todayTripsCount,
    inspectionPhotos,
    addInspectionPhoto,
    walletBalance,
    depositBalance,
  } = useDriverStore();

  // Local state for interactive trip execution
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('Hỏng xe / nổ lốp / trục trặc động cơ');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentReported, setIncidentReported] = useState(false);

  // Dynamic photos list in local state for realistic live uploading
  const [driverInspectionPhotos, setDriverInspectionPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  ]);

  // Inspection upload state
  const [selectedInspectionZoom, setSelectedInspectionZoom] = useState<string | null>(null);

  // POD & COD collection state
  const [podPhoto, setPodPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80'
  );
  const [podSignaturePhoto, setPodSignaturePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
  );
  const [isCodCollected, setIsCodCollected] = useState(false);
  const [codAmountToCollect, setCodAmountToCollect] = useState<number>(0);

  // Real-time Photo Upload Handlers (FileReader for actual realistic testing)
  const handleUploadInspectionPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            setDriverInspectionPhotos((prev) => [...prev, dataUrl]);
            addInspectionPhoto(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUploadPodPhoto = (e: React.ChangeEvent<HTMLInputElement>, isSignature = false) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          if (isSignature) {
            setPodSignaturePhoto(dataUrl);
          } else {
            setPodPhoto(dataUrl);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleRemoveInspectionPhoto = (index: number) => {
    setDriverInspectionPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Waiting for customer approval simulation when PickedUp
  const [isCustomerApproving, setIsCustomerApproving] = useState(false);

  // Sync codAmount from activeTrip
  useEffect(() => {
    if (activeTrip) {
      setCodAmountToCollect(activeTrip.codAmount || 0);
      setIsCodCollected(activeTrip.paymentMethod === 'PayOS');
    }
  }, [activeTrip]);

  // Sync real status from order.service.ts
  const syncWithSharedOrders = (status: OrderStatus) => {
    if (activeTrip) {
      orderService.updateOrderStatus(activeTrip.id, status);
      // dispatch storage event for cross-tab sync if customer is watching
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Step 1: Driver confirms arrival at pickup
  const handleArrivedAtPickup = () => {
    confirmArrivalAtPickup();
    syncWithSharedOrders('Arrived');
  };

  // Step 2: Driver uploads cargo inspection and submits for customer approval
  const handleConfirmCargoLoaded = () => {
    confirmCargoLoaded();
    syncWithSharedOrders('PickedUp');
    setIsCustomerApproving(true);

    // Simulate customer approving departure after 3 seconds or driver can bypass
    setTimeout(() => {
      setIsCustomerApproving(false);
      setTripStage('IN_TRANSIT');
      syncWithSharedOrders('InTransit');
    }, 4000);
  };

  // Step 3: Driver arrives at destination
  const handleArrivedAtDestination = () => {
    setTripStage('POD_DELIVERY');
  };

  // Step 4: Driver completes delivery with POD
  const handleCompleteDelivery = () => {
    completeTrip();
    syncWithSharedOrders('Delivered');
  };

  // Report incident
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentReported(true);
    setTimeout(() => {
      setIncidentReported(false);
      setShowIncidentModal(false);
      setIncidentDesc('');
    }, 1800);
  };

  // Current progress milestone index
  const getCurrentMilestoneIndex = () => {
    switch (tripStage) {
      case 'NAVIGATING_PICKUP':
        return 0;
      case 'CARGO_INSPECTION':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'POD_DELIVERY':
        return 3;
      case 'TRIP_COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  const currentMilestoneIdx = getCurrentMilestoneIndex();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 30-Second Job Offer Pop-up Modal */}
      <JobAlertModal />

      {/* ========================================================================= */}
      {/* 1. TOP UTILITY STATUS BAR (Exact visual layout matching Customer) */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer md:hidden"
            title="Mở menu"
          >
            <Truck className="w-4 h-4 text-brand-600" />
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                activeTrip ? 'bg-brand-500' : isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            >
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-slate-900 leading-none">
                  Chuyến xe yêu cầu
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isOnline
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span>{isOnline ? 'TRỰC TUYẾN' : 'NGHỈ CA'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                Xe Tải 1 Tấn (29C-874.12) • Nguyễn Văn Hùng
              </p>
            </div>
          </div>
        </div>

        {/* Right actions: Nghỉ cuốc / Bật xe placed right next to Báo sự cố khẩn cấp */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Simulator button when idle */}
          {!activeTrip && (
            <button
              type="button"
              onClick={() => triggerJobOffer()}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-orange-200 font-bold text-xs transition cursor-pointer"
              title="Phát đơn giả lập để kiểm tra luồng nhận chuyến"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Phát cuốc thử nghiệm</span>
            </button>
          )}

          {/* Duty toggle button: placed right next to emergency incident button */}
          <button
            type="button"
            onClick={toggleOnline}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isOnline
                ? 'bg-slate-900 hover:bg-black text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Bấm để bật hoặc nghỉ ca trực tiếp"
          >
            <Power className="w-3.5 h-3.5 text-white" />
            <span>{isOnline ? 'NGHỈ CUỐC (OFFLINE)' : 'BẬT XE (ONLINE)'}</span>
          </button>

          {/* Report Incident CTA button (UC-DRV-18) */}
          {activeTrip && (
            <button
              type="button"
              onClick={() => setShowIncidentModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Báo sự cố khẩn cấp</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT MAP CANVAS (60%) & RIGHT PROGRESS (40%) */}
      {/* ========================================================================= */}
      <div className="flex-1 px-4 sm:px-6 py-4 max-w-[1680px] w-full mx-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
          {/* ------------------------------------------------------------------- */}
          {/* LEFT COLUMN: INTERACTIVE NAVIGATION MAP & ROUTE OVERLAY */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4 min-w-0">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex-1 flex flex-col min-h-[480px] sm:min-h-[580px] relative overflow-hidden">
              {/* Map Floating Header Bar */}
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2 flex-wrap max-w-[85%]">
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-2xl shadow-lg border border-slate-700/60 text-xs font-bold flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeTrip ? 'bg-brand-500 animate-ping' : isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {activeTrip
                      ? tripStage === 'NAVIGATING_PICKUP'
                        ? 'Dẫn đường tới Điểm lấy hàng'
                        : tripStage === 'CARGO_INSPECTION'
                        ? 'Đang có mặt tại điểm bốc hàng'
                        : tripStage === 'IN_TRANSIT'
                        ? 'Đang vận chuyển trên tuyến đường'
                        : tripStage === 'POD_DELIVERY'
                        ? 'Đã tới điểm giao hàng'
                        : 'Hoàn tất chuyến xe'
                      : isOnline
                      ? 'Đang trực tuyến • Đang quét cuốc xe gần bạn'
                      : 'Xe đang nghỉ ca • Bật xe để nhận cuốc'}
                  </span>
                </div>

                {activeTrip && (
                  <div className="bg-white/95 backdrop-blur-md text-slate-700 px-3 py-1.5 rounded-xl shadow border border-slate-200 text-[11px] font-extrabold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    <span>Khoảng cách: {formatDistance(activeTrip.totalDistanceKm)}</span>
                  </div>
                )}
              </div>

              {/* Map floating ETA Badge at Top Right */}
              {activeTrip && (
                <div className="absolute top-6 right-6 z-20 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xs flex items-center gap-3 border border-slate-700">
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Thời gian dự kiến
                    </div>
                    <div className="text-lg font-black leading-tight text-blue-400">
                      ~{activeTrip.estimatedDurationMins || 25} Phút
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              )}

              {/* Interactive Vector Map SVG (Exact modern styling as Customer) */}
              <div className="flex-1 w-full bg-[#E9EFF5] rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner select-none">
                <svg
                  className="w-full h-full absolute inset-0"
                  viewBox="0 0 720 420"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <pattern id="driver-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D3DDE8" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#E9EFF5" />
                  <rect width="100%" height="100%" fill="url(#driver-map-grid)" />

                  {/* Water canals / River stream */}
                  <path
                    d="M 120,0 C 180,140 240,240 210,420"
                    fill="none"
                    stroke="#B4E5F0"
                    strokeWidth="36"
                    strokeLinecap="round"
                  />

                  {/* Major Highway Grids */}
                  <path d="M 0,160 L 720,160" stroke="#CBD5E1" strokeWidth="16" />
                  <path d="M 0,280 L 720,280" stroke="#CBD5E1" strokeWidth="12" />
                  <path d="M 360,0 L 360,420" stroke="#CBD5E1" strokeWidth="14" />
                  <path d="M 520,0 L 520,420" stroke="#E2E8F0" strokeWidth="8" />

                  {/* Active Route Path from A (180, 290) to B (540, 120) */}
                  {activeTrip && (
                    <>
                      {/* Route shadow glow */}
                      <path
                        d="M 180,290 C 260,290 320,220 390,220 C 460,220 480,120 540,120"
                        fill="none"
                        stroke="#FF5722"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeOpacity="0.3"
                      />
                      {/* Main dashed active route line */}
                      <path
                        d="M 180,290 C 260,290 320,220 390,220 C 460,220 480,120 540,120"
                        fill="none"
                        stroke="#FF5722"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="8 6"
                      />
                    </>
                  )}

                  {/* Point A: Pickup Location */}
                  <g transform="translate(180, 290)">
                    <circle r="14" fill="#10B981" fillOpacity="0.25" className="animate-ping" />
                    <circle r="9" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
                    <text y="-14" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="bold">
                      A (Điểm lấy hàng)
                    </text>
                  </g>

                  {/* Point B: Dropoff Location */}
                  <g transform="translate(540, 120)">
                    <circle r="14" fill="#EF4444" fillOpacity="0.25" />
                    <circle r="9" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.5" />
                    <text y="-14" textAnchor="middle" fill="#B91C1C" fontSize="11" fontWeight="bold">
                      B (Điểm giao hàng)
                    </text>
                  </g>

                  {/* Driver Vehicle Real-time position Pin */}
                  {activeTrip && (
                    <g
                      transform={`translate(${
                        tripStage === 'NAVIGATING_PICKUP'
                          ? '180, 290'
                          : tripStage === 'CARGO_INSPECTION'
                          ? '180, 290'
                          : tripStage === 'IN_TRANSIT'
                          ? '390, 220'
                          : '540, 120'
                      })`}
                      className="transition-all duration-1000 ease-in-out cursor-pointer"
                    >
                      <circle r="22" fill="#FF5722" fillOpacity="0.2" className="animate-ping" />
                      <circle r="16" fill="#1E293B" stroke="#FFFFFF" strokeWidth="3" />
                      <path
                        d="M -7,-5 L 7,-5 L 5,6 L -5,6 Z"
                        fill="#FF5722"
                      />
                      <rect x="-8" y="-3" width="16" height="8" rx="2" fill="#FFFFFF" />
                      {/* Truck badge label */}
                      <g transform="translate(0, 28)">
                        <rect x="-42" y="-10" width="84" height="20" rx="10" fill="#0F172A" />
                        <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                          Xe 29C-874.12
                        </text>
                      </g>
                    </g>
                  )}
                </svg>

                {/* Empty State Banner when no active order */}
                {!activeTrip && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-brand-600 mx-auto flex items-center justify-center animate-bounce">
                        <Truck className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">
                          {isOnline ? 'Đang sẵn sàng nhận cuốc xe!' : 'Bạn đang ở chế độ Nghỉ ca'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {isOnline
                            ? 'Giữ ứng dụng luôn bật. Hệ thống ModMove tự động điều phối các đơn hàng gần bạn nhất.'
                            : 'Gạt nút BẬT XE ở góc trên để bắt đầu ca làm việc và nhận thông báo đơn hàng mới.'}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                        {!isOnline ? (
                          <button
                            type="button"
                            onClick={toggleOnline}
                            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                          >
                            Bật xe ngay (Online)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerJobOffer()}
                            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Giả lập cuốc xe mới (30s Alert)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Footer Route Details Info Bar */}
              {activeTrip && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Lấy:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[280px]">
                      {activeTrip.pickup.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Giao:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[280px]">
                      {activeTrip.dropoff.address}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: PROGRESS TIMELINE, STEP EXECUTION & CARGO CONTROLS */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 min-w-0">
            {/* Card 1: Thanh tiến trình thực hiện chuyến xe của Tài xế */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                  <h3 className="font-black text-sm text-slate-900">
                    Tiến trình chuyến xe
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  #{activeTrip?.code || 'CHƯA CÓ ĐƠN'}
                </span>
              </div>

              {/* Step Timeline */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {DRIVER_MILESTONES.map((milestone, idx) => {
                  const isCompleted = currentMilestoneIdx > idx;
                  const isCurrent = currentMilestoneIdx === idx;

                  return (
                    <div key={milestone.stage} className="relative flex items-start gap-3">
                      {/* Milestone Dot */}
                      <div
                        className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                            : isCurrent
                            ? 'bg-brand-500 text-white ring-4 ring-orange-100 animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <span className="text-[10px]">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              isCurrent
                                ? 'text-brand-600 font-black'
                                : isCompleted
                                ? 'text-slate-900 font-extrabold'
                                : 'text-slate-400'
                            }`}
                          >
                            {milestone.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-50 text-brand-600 font-extrabold px-1.5 py-0.5 rounded border border-brand-200">
                              HIỆN TẠI
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            isCurrent ? 'text-slate-700 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {milestone.subTitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD 2: KHỐI THAO TÁC CỤ THỂ THEO BƯỚC (ĐỒNG BỘ LOGIC CUSTOMER - DRIVER) */}
            {/* ========================================================================= */}
            {activeTrip && (
              <div className="space-y-4">
                {/* BƯỚC 1: ĐANG TỚI ĐIỂM LẤY HÀNG (NAVIGATING_PICKUP) */}
                {tripStage === 'NAVIGATING_PICKUP' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 animate-slideRight">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                            BƯỚC 1: DẪN ĐƯỜNG TỚI ĐIỂM LẤY HÀNG
                          </h4>
                          <span className="text-[10px] text-blue-600 font-extrabold uppercase">
                            DI CHUYỂN TỚI ĐỊA CHỈ NGƯỜI GỬI
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium text-[10px] block">ĐỊA CHỈ NGƯỜI GỬI:</span>
                        <span className="font-extrabold text-slate-800 leading-tight block">
                          {activeTrip.pickup.address}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Người liên hệ:</span>
                        <span className="font-bold text-slate-800">
                          {activeTrip.pickup.contactName} ({activeTrip.pickup.contactPhone})
                        </span>
                      </div>
                      {activeTrip.pickup.note && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                          Ghi chú: {activeTrip.pickup.note}
                        </div>
                      )}
                    </div>

                    {/* Quick Call contact button */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${activeTrip.pickup.contactPhone}`}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gọi người gửi</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleArrivedAtPickup}
                        className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Tôi đã đến điểm lấy hàng (Arrived)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BƯỚC 2: CHỤP ẢNH BỐC HÀNG & CHỜ KHÁCH DUYỆT (CARGO_INSPECTION) */}
                {(tripStage === 'CARGO_INSPECTION' || isCustomerApproving) && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 animate-slideRight">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                            BƯỚC 2: KIỂM TRẠNG & CHỤP ẢNH BỐC HÀNG
                          </h4>
                          <span className="text-[10px] text-brand-600 font-extrabold uppercase">
                            CHỤP ẢNH HIỆN TRẠNG & GỬI DUYỆT
                          </span>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping flex-shrink-0" />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Chụp tối thiểu 2 ảnh hiện trạng hàng hóa đưa lên xe để gửi sang màn hình Customer phê duyệt trước khi xuất phát:
                    </p>

                    {/* Cargo Specs Check */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Hàng hóa:</span>
                        <span className="font-extrabold text-slate-900 text-right truncate max-w-[180px]">
                          {activeTrip.cargo.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Số lượng / Trọng lượng:</span>
                        <span className="font-extrabold text-slate-900">
                          {activeTrip.cargo.quantity} kiện • {activeTrip.cargo.weightKg} kg
                        </span>
                      </div>
                    </div>

                    {/* 2 Evidence Photos Thumbnails with live upload & camera */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>📸</span>
                          <span>Ảnh tài xế chụp thực tế ({driverInspectionPhotos.length} ảnh)</span>
                        </span>
                        <span className="text-[10px] text-brand-600 font-bold">Tối thiểu 2 ảnh</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {driverInspectionPhotos.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="group relative h-28 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-brand-500 shadow-xs bg-slate-100 transition"
                          >
                            <img
                              src={imgUrl}
                              alt={`Ảnh bốc hàng ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300 cursor-pointer"
                              onClick={() => setSelectedInspectionZoom(imgUrl)}
                            />
                            <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/50 flex flex-col items-center justify-center text-white transition pointer-events-none">
                              <ZoomIn className="w-5 h-5 mb-0.5" />
                              <span className="text-[10px] font-bold">
                                {idx === 0 ? '1. Ảnh toàn cảnh' : idx === 1 ? '2. Ảnh chằng buộc' : `Ảnh ${idx + 1}`}
                              </span>
                            </div>
                            {/* Remove photo button */}
                            {driverInspectionPhotos.length > 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveInspectionPhoto(idx);
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer"
                                title="Xóa ảnh này"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Interactive Upload / Camera Trigger Tile */}
                        <label className="relative h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 flex flex-col items-center justify-center text-slate-700 cursor-pointer transition shadow-2xs group">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={handleUploadInspectionPhoto}
                            className="hidden"
                          />
                          <div className="w-9 h-9 rounded-full bg-slate-200 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition mb-1 text-slate-700 shadow-xs">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold">Chụp / Tải ảnh lên</span>
                          <span className="text-[9px] text-slate-500 font-medium">Bấm để mở máy ảnh</span>
                        </label>
                      </div>
                    </div>

                    {/* Customer Approval Status Waiting Banner */}
                    {isCustomerApproving ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3 animate-pulse">
                        <RefreshCw className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
                        <div>
                          <div className="font-black text-xs text-amber-900">
                            Đang chờ khách hàng phê duyệt ảnh xuất phát...
                          </div>
                          <div className="text-[11px] text-amber-700">
                            Hệ thống đang đồng bộ dữ liệu tới màn hình của khách hàng
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={driverInspectionPhotos.length < 2}
                        onClick={handleConfirmCargoLoaded}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer ${
                          driverInspectionPhotos.length >= 2
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Xác nhận bốc hàng ({driverInspectionPhotos.length} ảnh) & Gửi khách duyệt</span>
                      </button>
                    )}
                  </div>
                )}

                {/* BƯỚC 3: ĐANG VẬN CHUYỂN TỚI ĐIỂM GIAO (IN_TRANSIT) */}
                {tripStage === 'IN_TRANSIT' && (
                  <div className="bg-gradient-to-b from-sky-50/80 via-white to-white border-2 border-sky-500 rounded-3xl p-4 sm:p-5 shadow-md shadow-sky-500/10 space-y-3.5 animate-slideRight">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <Navigation className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                            BƯỚC 3: ĐANG TRÊN ĐƯỜNG GIAO HÀNG
                          </h4>
                          <span className="text-[10px] text-sky-700 font-extrabold uppercase">
                            DI CHUYỂN TỚI ĐỊA CHỈ NGƯỜI NHẬN
                          </span>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping flex-shrink-0" />
                    </div>

                    <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-2 text-xs shadow-2xs">
                      <div>
                        <span className="text-slate-400 font-medium text-[10px] block">ĐỊA CHỈ GIAO TỚI:</span>
                        <span className="font-extrabold text-slate-800 leading-tight block">
                          {activeTrip.dropoff.address}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Người nhận hàng:</span>
                        <span className="font-bold text-slate-800">
                          {activeTrip.dropoff.contactName} ({activeTrip.dropoff.contactPhone})
                        </span>
                      </div>
                      {activeTrip.dropoff.note && (
                        <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium">
                          Ghi chú: {activeTrip.dropoff.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${activeTrip.dropoff.contactPhone}`}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                        <span>Gọi người nhận</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleArrivedAtDestination}
                        className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/25 transition cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Tôi đã đến điểm giao hàng</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BƯỚC 4: BÀN GIAO POD & THU TIỀN COD (POD_DELIVERY) */}
                {tripStage === 'POD_DELIVERY' && (
                  <div className="bg-gradient-to-b from-emerald-50/80 via-white to-white border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-md shadow-emerald-500/10 space-y-3.5 animate-slideRight">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                            BƯỚC 4: BÀN GIAO HÀNG & THU TIỀN MẶT
                          </h4>
                          <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                            CHỤP ẢNH BÀN GIAO & HOÀN TẤT ĐƠN HÀNG
                          </span>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                    </div>

                    {/* Proof of Delivery (POD) Photo Upload / Camera */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>📸</span>
                          <span>Ảnh bàn giao & Biên bản ký nhận (POD)</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">Bấm để chụp / đổi ảnh</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* 1. Ảnh hiện trạng giao */}
                        <div className="space-y-1.5">
                          <div
                            onClick={() => setSelectedInspectionZoom(podPhoto)}
                            className="group relative h-28 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 cursor-pointer shadow-xs bg-slate-100 transition"
                          >
                            <img
                              src={podPhoto}
                              alt="POD hàng hóa"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/50 flex flex-col items-center justify-center text-white transition">
                              <ZoomIn className="w-5 h-5 mb-0.5" />
                              <span className="text-[10px] font-bold">Ảnh hiện trạng giao</span>
                            </div>
                          </div>

                          <label className="w-full py-1.5 px-2 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleUploadPodPhoto(e, false)}
                              className="hidden"
                            />
                            <Camera className="w-3.5 h-3.5" />
                            <span>Chụp lại ảnh giao</span>
                          </label>
                        </div>

                        {/* 2. Ảnh biên bản & chữ ký */}
                        <div className="space-y-1.5">
                          <div
                            onClick={() => setSelectedInspectionZoom(podSignaturePhoto)}
                            className="group relative h-28 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 cursor-pointer shadow-xs bg-slate-100 transition"
                          >
                            <img
                              src={podSignaturePhoto}
                              alt="Biên bản bàn giao"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/50 flex flex-col items-center justify-center text-white transition">
                              <ZoomIn className="w-5 h-5 mb-0.5" />
                              <span className="text-[10px] font-bold">Biên bản & Chữ ký</span>
                            </div>
                          </div>

                          <label className="w-full py-1.5 px-2 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleUploadPodPhoto(e, true)}
                              className="hidden"
                            />
                            <Camera className="w-3.5 h-3.5" />
                            <span>Chụp lại biên bản</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* COD Cash Collection Section (UC-DRV-17) */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>Thu tiền mặt (COD / Cước phí):</span>
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {activeTrip.paymentMethod === 'Cash'
                            ? formatCurrency(activeTrip.totalFee + codAmountToCollect)
                            : formatCurrency(codAmountToCollect)}
                        </span>
                      </div>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCodCollected}
                          onChange={(e) => setIsCodCollected(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="text-slate-800 font-bold text-[11px]">
                          Tôi đã nhận đủ tiền mặt từ người nhận
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={!isCodCollected}
                      onClick={handleCompleteDelivery}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer ${
                        isCodCollected
                          ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/25'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCheck className="w-4 h-4 stroke-[3]" />
                      <span>Hoàn thành chuyến xe & Nhận thù lao</span>
                    </button>
                  </div>
                )}

                {/* BƯỚC 5: CHUYẾN ĐI HOÀN TẤT (TRIP_COMPLETED) */}
                {tripStage === 'TRIP_COMPLETED' && (
                  <div className="bg-gradient-to-b from-emerald-50/80 via-white to-white border-2 border-emerald-500 rounded-3xl p-5 shadow-lg shadow-emerald-500/10 text-center space-y-3 animate-slideRight">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                      <CheckCheck className="w-8 h-8 stroke-[3] animate-bounce" />
                    </div>

                    <div>
                      <h4 className="font-black text-base text-slate-900">Chuyến xe hoàn tất xuất sắc!</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Cước phí đã được khấu trừ 20% hoa hồng sàn và cộng trực tiếp vào ví khả dụng của bạn.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Thù lao thực nhận (Net):
                      </span>
                      <span className="text-2xl font-black text-emerald-600 block">
                        +{formatCurrency(Math.round(activeTrip.totalFee * 0.8))}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={resetTrip}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs sm:text-sm transition cursor-pointer"
                    >
                      Tiếp tục nhận cuốc mới
                    </button>
                  </div>
                )}

                {/* Card 3: Chi tiết Hàng hóa & Cước phí chuyến đi */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-brand-600" />
                      <span>Thông tin cước phí & Hàng hóa</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500">
                      Hoa hồng sàn: 20%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng cước khách trả:</span>
                      <span className="font-extrabold text-slate-800">
                        {formatCurrency(activeTrip.totalFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phí hoa hồng ModMove (20%):</span>
                      <span className="font-medium text-rose-600">
                        -{formatCurrency(Math.round(activeTrip.totalFee * 0.2))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="font-black text-slate-900">Tài xế thực nhận:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        +{formatCurrency(Math.round(activeTrip.totalFee * 0.8))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL BÁO CÁO SỰ CỐ KHẨN CẤP TRÊN ĐƯỜNG (UC-DRV-18) */}
      {/* ========================================================================= */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Báo cáo sự cố khẩn cấp trên đường</h3>
                  <span className="text-[10px] text-rose-100 font-bold uppercase">
                    Hỗ trợ tài xế trực tiếp 24/7
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {incidentReported ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-black text-slate-800 text-base">Đã gửi báo cáo khẩn cấp thành công!</h4>
                <p className="text-xs text-slate-500">
                  Trung tâm Điều phối (Dispatcher) đã nhận tín hiệu và đang liên hệ điều xe hỗ trợ.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportIncident} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    Loại sự cố phát sinh:
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>Hỏng xe / nổ lốp / trục trặc động cơ</option>
                    <option>Va chạm giao thông / Ngập lụt tắc đường</option>
                    <option>Hàng hóa đổ vỡ / Rách bao bì trong lúc chạy</option>
                    <option>Khách hàng không nghe máy / Từ chối nhận đồ</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    Mô tả cụ thể vị trí và tình trạng:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Nhập chi tiết vị trí xe đang dừng và sự cố cần hỗ trợ..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/25 transition cursor-pointer"
                  >
                    Gửi tới Dispatcher
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Zoom for Evidence / POD photos */}
      {selectedInspectionZoom && (
        <div
          onClick={() => setSelectedInspectionZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={selectedInspectionZoom}
              alt="Ảnh phóng to"
              className="w-full h-full object-contain max-h-[80vh] mx-auto bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
