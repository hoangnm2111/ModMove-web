import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/order.service';
import { ShippingOrder, OrderStatus } from '../../types/order.types';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { formatCurrency, formatDistance } from '../../utils/format';
import {
  Truck,
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RotateCw,
  Navigation,
  Compass,
  ArrowLeft,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Send,
  Radio,
  ExternalLink,
  ChevronDown,
  Info,
  Star,
  ThumbsUp,
  ZoomIn,
  ZoomOut,
  CheckCheck,
} from 'lucide-react';
import { useCustomerLayout } from '../../layouts/CustomerLayout';

// Status milestones definition strictly following Report-3 SRS Order Lifecycle:
// 1. Pending (PlaceOrder) -> 2. Accepted -> 3. Arrived -> 4. PickedUp -> 5. InTransit -> 6. Delivered -> 7. Completed
interface ProgressMilestone {
  key: OrderStatus;
  label: string;
  subLabel: string;
  description: string;
  order: number;
}

const PROGRESS_MILESTONES: ProgressMilestone[] = [
  {
    key: 'PlaceOrder',
    label: 'Chờ tài xế nhận đơn (Pending)',
    subLabel: 'Đang tìm kiếm xe phù hợp',
    description: 'Đơn hàng đã được tạo thành công và đang phát sóng tìm tài xế gần bạn nhất.',
    order: 1,
  },
  {
    key: 'Accepted',
    label: 'Đã nhận đơn (Accepted)',
    subLabel: 'Tài xế đang tới điểm lấy hàng',
    description: 'Một tài xế đã nhận đơn hàng và đang chuẩn bị di chuyển đến điểm lấy hàng.',
    order: 2,
  },
  {
    key: 'Arrived',
    label: 'Đã đến điểm lấy (Arrived)',
    subLabel: 'Kiểm tra & bốc xếp hàng',
    description: 'Tài xế đã tới địa chỉ lấy hàng và chuẩn bị kiểm tra, bốc xếp hàng hóa lên xe.',
    order: 3,
  },
  {
    key: 'PickedUp',
    label: 'Đã lấy hàng (PickedUp)',
    subLabel: 'Chờ khách phê duyệt xuất phát',
    description: 'Hàng hóa đã được kiểm tra, chụp ảnh xác thực đưa lên xe (Chờ khách duyệt để khởi hành).',
    order: 4,
  },
  {
    key: 'InTransit',
    label: 'Đang vận chuyển (InTransit)',
    subLabel: 'Đang giao tới người nhận',
    description: 'Hàng đang trên đường vận chuyển (khách hàng theo dõi vị trí xe trực tiếp trên bản đồ).',
    order: 5,
  },
  {
    key: 'Delivered',
    label: 'Đã giao hàng đến nơi (Delivered)',
    subLabel: 'Hoàn tất bàn giao & ảnh POD',
    description: 'Tài xế đã tới điểm đến, hoàn tất giao hàng và tải lên ảnh chữ ký/bằng chứng giao hàng.',
    order: 6,
  },
  {
    key: 'Completed',
    label: 'Hoàn tất đơn hàng (Completed)',
    subLabel: 'Khách xác nhận hoàn tất',
    description: 'Khách hàng đã kiểm tra hàng và xác nhận nhận hàng thành công, kết thúc chu trình.',
    order: 7,
  },
];

export const LiveTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toggleSidebar } = useCustomerLayout();

  // Load orders
  const [orders, setOrders] = useState<ShippingOrder[]>(() => orderService.getOrders());
  
  // Find order by search params code/id or pick the first active order
  const orderParam = searchParams.get('order') || searchParams.get('id');
  
  const activeOrder = React.useMemo(() => {
    if (orderParam) {
      const found = orders.find(
        (o) => o.code.toLowerCase() === orderParam.toLowerCase() || o.id === orderParam
      );
      if (found) return found;
    }
    // Default to the first active order needing customer verification (PickedUp), then other active orders
    const pickedUp = orders.find((o) => o.status === 'PickedUp');
    if (pickedUp) return pickedUp;
    const inTransit = orders.find(
      (o) => o.status === 'InTransit' || o.status === 'Arrived' || o.status === 'Accepted'
    );
    return inTransit || orders[0] || null;
  }, [orders, orderParam]);

  // Selected order state for the user to switch between active orders if multiple
  const [selectedOrderId, setSelectedOrderId] = useState<string>(activeOrder?.id || '');

  useEffect(() => {
    if (activeOrder && !selectedOrderId) {
      setSelectedOrderId(activeOrder.id);
    }
  }, [activeOrder, selectedOrderId]);

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || activeOrder;
  }, [orders, selectedOrderId, activeOrder]);

  // Real-time Driver Simulation Coordinates
  // If PickedUp, truck is still waiting at point A (progress = 0)
  const isWaitingPickupApproval = currentOrder?.status === 'PickedUp' || currentOrder?.status === 'Arrived';
  const [driverProgress, setDriverProgress] = useState(isWaitingPickupApproval ? 0 : 45);
  const [etaMinutes, setEtaMinutes] = useState(isWaitingPickupApproval ? 22 : 14);
  const [isWebSocketOnline, setIsWebSocketOnline] = useState(true);
  const [lastLocationSecondsAgo, setLastLocationSecondsAgo] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastLocationSecondsAgo((prev) => (prev > 15 ? 1 : prev + 1));
      // Only advance truck when actually in transit
      if (currentOrder?.status === 'InTransit') {
        setDriverProgress((prev) => {
          if (prev >= 92) return 92;
          return prev + 0.3;
        });
      } else if (currentOrder?.status === 'PickedUp') {
        setDriverProgress(0);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentOrder?.status]);

  // Modal Incident Report (UC-CUS-15)
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState<
    'Delay' | 'WrongRoute' | 'DriverMisconduct' | 'CargoDamage' | 'CargoLoss'
  >('Delay');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPhotos, setIncidentPhotos] = useState<string[]>([]);
  const [incidentSuccessMessage, setIncidentSuccessMessage] = useState(false);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // Modal 1: Phê duyệt trước khi khởi hành (Pickup Cargo Verification - UC-CUS-11 & UC-CUS-12)
  const [showPickupProofModal, setShowPickupProofModal] = useState(false);
  const [pickupRejectReason, setPickupRejectReason] = useState('');
  const [showPickupRejectInput, setShowPickupRejectInput] = useState(false);
  const [selectedPickupZoomPhoto, setSelectedPickupZoomPhoto] = useState<string | null>(null);

  // Modal 2: Xác nhận khi giao đến nơi (Delivery Receipt Confirmation - UC-CUS-19 & UC-DRV-16)
  const [showDeliveryReceiptModal, setShowDeliveryReceiptModal] = useState(false);
  const [selectedDeliveryZoomPhoto, setSelectedDeliveryZoomPhoto] = useState<string | null>(null);

  // Modal 3: Đánh giá chuyến đi (Trip Rating - UC-CUS-25)
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingTags, setRatingTags] = useState<string[]>(['Đúng giờ', 'Bốc xếp cẩn thận', 'Thân thiện']);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Pickup Evidence Photos mock (BF-04: At least 2 photos)
  const pickupEvidencePhotos = [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  ];

  // Delivery Proof of Delivery (POD) Photos mock (BF-05: Delivery photo + signed voucher)
  const deliveryPodPhotos = [
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
  ];

  // Handler: Khách hàng Phê duyệt ảnh lấy hàng & cho phép khởi hành (UC-CUS-12: PickedUp -> InTransit)
  const handleApprovePickupEvidence = () => {
    if (!currentOrder) return;
    orderService.updateOrderStatus(currentOrder.id, 'InTransit');
    setOrders(orderService.getOrders());
    setShowPickupProofModal(false);
    setShowPickupRejectInput(false);
    alert('Đã phê duyệt ảnh kiểm trạng thành công! Chuyến xe bắt đầu khởi hành giao hàng (InTransit).');
  };

  // Handler: Khách hàng Từ chối ảnh lấy hàng (Reject Cargo Evidence)
  const handleRejectPickupEvidence = () => {
    if (!pickupRejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối ảnh hiện trạng!');
      return;
    }
    setShowPickupProofModal(false);
    setShowPickupRejectInput(false);
    alert(`Đã gửi yêu cầu chụp lại ảnh tới tài xế. Lý do: "${pickupRejectReason}"`);
    setPickupRejectReason('');
  };

  // Handler: Khách hàng Xác nhận đã nhận hàng (UC-CUS-19: Delivered -> Completed)
  const handleConfirmCargoReceipt = () => {
    if (!currentOrder) return;
    orderService.updateOrderStatus(currentOrder.id, 'Completed');
    setOrders(orderService.getOrders());
    setShowDeliveryReceiptModal(false);
    // Mở ngay màn hình đánh giá chuyến đi theo quy trình SRS Step 6
    setTimeout(() => {
      setShowRatingModal(true);
    }, 400);
  };

  // Handler: Gửi đánh giá tài xế (UC-CUS-25)
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSuccess(true);
    setTimeout(() => {
      setShowRatingModal(false);
      setRatingSuccess(false);
      alert('Cảm ơn bạn đã đánh giá chuyến đi! Đơn hàng đã hoàn tất trọn vẹn.');
    }, 1500);
  };

  // Helper toggle tag
  const toggleRatingTag = (tag: string) => {
    setRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Incident Photo Upload Handler (up to 5 photos)
  const handleUploadIncidentPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (incidentPhotos.length >= 5) {
        alert('Tối đa 5 ảnh hiện trường sự cố!');
        return;
      }
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 5 - incidentPhotos.length;
      const filesToProcess = filesArray.slice(0, remainingSlots);

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setIncidentPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveIncidentPhoto = (index: number) => {
    setIncidentPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDescription.trim()) {
      alert('Vui lòng nhập mô tả chi tiết sự cố!');
      return;
    }
    setIsSubmittingIncident(true);
    setTimeout(() => {
      setIsSubmittingIncident(false);
      setIncidentSuccessMessage(true);
      setTimeout(() => {
        setShowIncidentModal(false);
        setIncidentSuccessMessage(false);
        setIncidentDescription('');
        setIncidentPhotos([]);
      }, 2000);
    }, 800);
  };

  // Determine active step index on timeline
  const getStepStatus = (stepKey: OrderStatus) => {
    if (!currentOrder) return 'upcoming';
    const statusSequence: OrderStatus[] = [
      'PlaceOrder',
      'Accepted',
      'Arrived',
      'PickedUp',
      'InTransit',
      'Delivered',
      'Completed',
    ];
    const currentIndex = statusSequence.indexOf(currentOrder.status);
    const stepIndex = statusSequence.indexOf(stepKey);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  // Fallback driver info if not assigned yet
  const driver = currentOrder?.assignedDriver || {
    name: 'Nguyễn Văn Hùng',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
    licensePlate: '29C-874.12',
    currentLat: 21.0115,
    currentLng: 105.65,
    lastUpdated: 'Vừa xong',
  };

  // Coordinates on SVG map based on driverProgress
  // Route from A (180, 290) to B (540, 120)
  const truckX = 180 + (540 - 180) * (driverProgress / 100);
  const truckY = 290 + (120 - 290) * (driverProgress / 100) - Math.sin((driverProgress / 100) * Math.PI) * 40;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: Theo dõi trực tiếp chuyến đi (Live Tracking) */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Theo dõi chuyến đi trực tiếp
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>GPS LIVE • WEBSOCKET</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Cập nhật định vị tài xế mỗi 3 giây • Lộ trình giao hàng nội đô theo thời gian thực
            </p>
          </div>
        </div>

        {/* Right side: Order Switcher / Selector & Quick State Simulator */}
        <div className="flex items-center gap-2">
          {/* Quick State Simulator Pill */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
            <span className="px-2 text-slate-400">Mô phỏng:</span>
            <button
              type="button"
              onClick={() => {
                if (currentOrder) {
                  orderService.updateOrderStatus(currentOrder.id, 'PickedUp');
                  setOrders(orderService.getOrders());
                }
              }}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                currentOrder?.status === 'PickedUp'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:bg-white text-slate-700'
              }`}
              title="Chuyển sang trạng thái Đã lấy hàng (Tài xế tải ảnh kiểm trạng)"
            >
              1. Lấy hàng (PickedUp)
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentOrder) {
                  orderService.updateOrderStatus(currentOrder.id, 'Delivered');
                  setOrders(orderService.getOrders());
                }
              }}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                currentOrder?.status === 'Delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'hover:bg-white text-slate-700'
              }`}
              title="Chuyển sang trạng thái Đã giao hàng (Tài xế tải ảnh POD)"
            >
              2. Giao xong (Delivered)
            </button>
          </div>

          {orders.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Đơn:</span>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.code} - {ORDER_STATUS_CONFIG[o.status]?.label || o.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Report Incident CTA button (UC-CUS-15) */}
          <button
            type="button"
            onClick={() => setShowIncidentModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Báo cáo sự cố</span>
          </button>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 3. MAIN 2-COLUMN WORKSPACE: LEFT MAP CANVAS (60%) & RIGHT PROGRESS (40%) */}
      {/* ========================================================================= */}
      <div className="flex-1 p-3 sm:p-5 max-w-[1680px] w-full mx-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-w-0">
          {/* ------------------------------------------------------------------- */}
          {/* LEFT COLUMN: LIVE MAP CANVAS (Google Maps Vector Simulation) */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3 min-w-0">
            {/* Map Canvas Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex-1 flex flex-col overflow-hidden relative min-h-[420px] sm:min-h-[500px]">
              {/* Map Floating Toolbar */}
              <div className="absolute top-6 left-6 z-20 flex flex-wrap items-center gap-2">
                {/* Status pill */}
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-2 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {currentOrder?.status === 'InTransit'
                      ? 'Tài xế đang di chuyển trên tuyến'
                      : currentOrder?.status === 'Arrived'
                      ? 'Tài xế đã có mặt tại điểm bốc xếp'
                      : 'Đang theo dõi vị trí thực địa'}
                  </span>
                </div>

                {/* Stale ping tracker */}
                <div className="bg-white/90 backdrop-blur-md text-slate-600 px-2.5 py-1.5 rounded-xl shadow border border-slate-200 text-[11px] font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Vừa nhận tín hiệu {lastLocationSecondsAgo}s trước</span>
                </div>
              </div>

              {/* Map floating ETA Badge at Top Right */}
              <div className="absolute top-6 right-6 z-20 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xs flex items-center gap-3 border border-slate-700">
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Dự kiến đến nơi (ETA)
                  </div>
                  <div className="text-lg font-black leading-tight text-blue-400">
                    ~{etaMinutes} Phút
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              {/* Interactive Vector Map SVG */}
              <div className="flex-1 w-full bg-[#E9EFF5] rounded-xl relative overflow-hidden border border-slate-200 shadow-inner select-none">
                <svg
                  className="w-full h-full absolute inset-0"
                  viewBox="0 0 720 420"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <pattern id="live-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D3DDE8" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#E9EFF5" />
                  <rect width="100%" height="100%" fill="url(#live-map-grid)" />

                  {/* Water canals / Red River stream */}
                  <path
                    d="M 120,0 C 180,140 240,240 210,420"
                    fill="none"
                    stroke="#B4E5F0"
                    strokeWidth="36"
                    strokeLinecap="round"
                  />

                  {/* Major Avenues / Expressway */}
                  <path d="M 0,310 L 720,110" fill="none" stroke="#FFFFFF" strokeWidth="18" />
                  <path d="M 0,310 L 720,110" fill="none" stroke="#CBD5E1" strokeWidth="22" opacity="0.35" />
                  <path d="M 180,0 L 520,420" fill="none" stroke="#FFFFFF" strokeWidth="14" />
                  <path d="M 60,420 L 660,0" fill="none" stroke="#FFFFFF" strokeWidth="10" />

                  {/* Active Route Path Polyline */}
                  <path
                    d="M 180,290 Q 320,160 540,120"
                    fill="none"
                    stroke="#FF5400"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />

                  {/* Traveled Route Path Polyline (Solid line before truck) */}
                  <path
                    d={`M 180,290 Q ${(180 + truckX) / 2},${(290 + truckY) / 2} ${truckX},${truckY}`}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  {/* Marker A: Điểm lấy hàng */}
                  <g transform="translate(180, 290)">
                    <circle r="16" fill="#0F172A" />
                    <circle r="24" fill="#0F172A" opacity="0.15" />
                    <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900">
                      A
                    </text>
                  </g>

                  {/* Marker B: Điểm giao hàng */}
                  <g transform="translate(540, 120)">
                    <circle r="16" fill="#EA580C" />
                    <circle r="26" fill="#EA580C" opacity="0.2" className="animate-ping" />
                    <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900">
                      B
                    </text>
                  </g>

                  {/* Dynamic Moving Truck Marker */}
                  <g transform={`translate(${truckX}, ${truckY})`}>
                    <circle r="20" fill="#FF5400" className="shadow-lg" />
                    <circle r="28" fill="#FF5400" opacity="0.25" className="animate-ping" />
                    {/* Truck icon center */}
                    <g transform="translate(-10, -10) scale(0.85)">
                      <path
                        d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                        fill="#FFFFFF"
                      />
                    </g>
                  </g>
                </svg>

                {/* Bottom Overlay Route Pill */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-200 pointer-events-auto flex items-center gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm đến hiện tại</div>
                      <div className="font-extrabold text-slate-800 truncate max-w-xs">
                        {currentOrder?.dropoff.address || 'Quận 1, TP. Hồ Chí Minh'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 pointer-events-auto flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-700">Tốc độ xe: ~38 km/h</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-brand-600">Đã đi: {Math.round(driverProgress)}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Info Bar under Map: Chuẩn chỉ, dễ hiểu cho khách hàng */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">
                    Tuyến đường di chuyển tối ưu tránh kẹt xe • GPS tự động định vị
                  </span>
                </div>

                {/* Contextual Action Button based on Order Status */}
                <div className="flex items-center gap-2">
                  {currentOrder?.status === 'PickedUp' && (
                    <button
                      type="button"
                      onClick={() => setShowPickupProofModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 text-xs font-bold border border-orange-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                      <span>Xem ảnh kiểm trạng bốc hàng</span>
                    </button>
                  )}

                  {currentOrder?.status === 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => setShowDeliveryReceiptModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xem ảnh bàn giao hàng (POD)</span>
                    </button>
                  )}

                  {['InTransit', 'Completed'].includes(currentOrder?.status || '') && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPickupProofModal(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                        title="Xem lại ảnh chụp lúc lấy hàng"
                      >
                        <ImageIcon className="w-3 h-3 text-slate-500" />
                        <span>Ảnh lấy hàng</span>
                      </button>

                      {currentOrder?.status === 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setShowDeliveryReceiptModal(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                          title="Xem lại ảnh bàn giao tại điểm đến"
                        >
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Ảnh bàn giao POD</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: PROGRESS TIMELINE, DRIVER PROFILE & SHIPMENT DETAILS */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 min-w-0">
            {/* Card 1: Thanh tiến trình trạng thái (Order Progress Status - UC-CUS-14) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                  <h3 className="font-black text-sm text-slate-900">
                    Tiến trình giao hàng
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  #{currentOrder?.code || 'MM-DATXE'}
                </span>
              </div>

              {/* Step Timeline */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {PROGRESS_MILESTONES.map((milestone) => {
                  const status = getStepStatus(milestone.key);
                  const isCompleted = status === 'completed';
                  const isCurrent = status === 'current';

                  return (
                    <div key={milestone.key} className="relative flex items-start gap-3">
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
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
                            {milestone.label}
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
                          {isCurrent ? milestone.description : milestone.subLabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. KHỐI KIỂM TRA ĐƠN HÀNG TRƯỚC KHI TÀI XẾ DI CHUYỂN (PickedUp / InTransit) */}
            {/* ========================================================================= */}
            {['PickedUp', 'InTransit', 'Arrived'].includes(currentOrder?.status || '') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 animate-slideRight">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                        Kiểm tra đơn hàng trước khi tài xế di chuyển
                      </h4>
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase">
                        {currentOrder?.status === 'PickedUp'
                          ? 'Yêu cầu khách duyệt khởi hành'
                          : 'Đã kiểm tra & Đang trên đường giao'}
                      </span>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${currentOrder?.status === 'PickedUp' ? 'bg-brand-500 animate-ping' : 'bg-emerald-500'} flex-shrink-0`} />
                </div>

                {/* Subtext instruction */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tài xế đã bốc xếp xong và chụp ảnh hiện trạng. Bạn vui lòng đối soát thông tin hàng hóa, bấm xem ảnh kiểm tra và xác nhận:
                </p>

                {/* Quick Cargo Specs Check */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Hàng hóa khai báo:</span>
                    <span className="font-extrabold text-slate-900 text-right truncate max-w-[180px]">
                      {currentOrder.cargo.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Số lượng & Trọng lượng:</span>
                    <span className="font-extrabold text-slate-900">
                      {currentOrder.cargo.quantity} kiện • {currentOrder.cargo.weightKg} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Xe vận chuyển:</span>
                    <span className="font-bold text-slate-800">
                      {currentOrder.vehicle.name} ({driver.licensePlate})
                    </span>
                  </div>
                </div>

                {/* Direct Visual Photo Thumbnails: To, rõ, bấm vào mở modal */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>📸</span>
                      <span>Ảnh tài xế vừa chụp tải lên (2 ảnh)</span>
                    </span>
                    <span className="text-[10px] text-brand-600 font-bold">Bấm để phóng to</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {pickupEvidencePhotos.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setShowPickupProofModal(true)}
                        className="group relative h-24 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-brand-500 cursor-pointer shadow-xs bg-slate-100 transition"
                      >
                        <img
                          src={imgUrl}
                          alt={`Ảnh bốc hàng ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/60 flex flex-col items-center justify-center text-white transition">
                          <ZoomIn className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-bold">
                            {idx === 0 ? 'Ảnh toàn cảnh' : 'Ảnh chằng buộc'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  {currentOrder?.status === 'PickedUp' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPickupProofModal(true);
                          setShowPickupRejectInput(true);
                        }}
                        className="py-2.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
                      >
                        Báo bất thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPickupProofModal(true)}
                        className="flex-1 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Check ảnh & Xác nhận (Confirm)</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPickupProofModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4 text-brand-600" />
                      <span>Xem lại chi tiết ảnh kiểm trạng bốc hàng</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. KHỐI ĐỐI SOÁT & XÁC NHẬN BÀN GIAO HÀNG (Delivered / Completed) (UC-CUS-19) */}
            {/* ========================================================================= */}
            {['Delivered', 'Completed'].includes(currentOrder?.status || '') && (
              <div className="bg-gradient-to-b from-emerald-50/80 via-white to-white border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-md shadow-emerald-500/10 space-y-3.5 animate-slideRight">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                        Kiểm tra & Xác nhận nhận hàng (POD)
                      </h4>
                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                        {currentOrder?.status === 'Delivered'
                          ? 'Đã giao tới điểm B • Chờ khách xác nhận'
                          : 'Đã nhận hàng thành công'}
                      </span>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${currentOrder?.status === 'Delivered' ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'} flex-shrink-0`} />
                </div>

                {/* Subtext instruction */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {currentOrder?.status === 'Delivered'
                    ? 'Tài xế đã bàn giao hàng hóa và tải lên bằng chứng giao hàng (POD). Vui lòng kiểm tra ảnh biên bản và bấm xác nhận:'
                    : 'Đơn hàng đã được xác nhận bàn giao hoàn tất an toàn. Bạn có thể xem lại ảnh chứng từ POD bất cứ lúc nào:'}
                </p>

                {/* Quick Delivery Specs Check */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Điểm giao nhận:</span>
                    <span className="font-extrabold text-slate-900 text-right truncate max-w-[190px]">
                      {currentOrder.dropoff.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Người nhận hàng:</span>
                    <span className="font-extrabold text-slate-900">
                      {currentOrder.dropoff.contactName} ({currentOrder.dropoff.contactPhone})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tài xế bàn giao:</span>
                    <span className="font-bold text-slate-800">
                      {driver.name} ({driver.licensePlate})
                    </span>
                  </div>
                </div>

                {/* Direct Visual POD Thumbnails */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>📄</span>
                      <span>Ảnh bàn giao & biên bản ký nhận (2 ảnh)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">Bấm để phóng to</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {deliveryPodPhotos.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setShowDeliveryReceiptModal(true)}
                        className="group relative h-24 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 cursor-pointer shadow-xs bg-slate-100 transition"
                      >
                        <img
                          src={imgUrl}
                          alt={`Ảnh bàn giao POD ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/60 flex flex-col items-center justify-center text-white transition">
                          <ZoomIn className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-bold">
                            {idx === 0 ? 'Hiện trạng nhận' : 'Biên bản & Chữ ký'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  {currentOrder?.status === 'Delivered' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryReceiptModal(true)}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryReceiptModal(true)}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Xác nhận đã nhận hàng</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeliveryReceiptModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4 text-emerald-600" />
                      <span>Xem lại chi tiết chứng từ bàn giao (POD)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Card 2: Thông tin tài xế & Phương tiện được gán (Driver Profile Card) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-600" />
                  <span>Tài xế & Phương tiện</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đã xác thực danh tính
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/30 shadow-xs flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-slate-900 truncate">
                    {driver.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {driver.licensePlate}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-amber-500">★ {driver.rating}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    Loại xe: {currentOrder?.vehicle.name || 'Xe Tải 1 - 2 Tấn'}
                  </div>
                </div>
              </div>

              {/* Driver Contact Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${driver.phone}`}
                  className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi {driver.phone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Mở cửa sổ Chat với tài xế ${driver.name}`)}
                  className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn tin tài xế</span>
                </button>
              </div>
            </div>

            {/* Card 3: Thông tin giao nhận hàng hóa & Cước phí */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="font-black text-xs sm:text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Chi tiết lộ trình</span>
                <span className="text-brand-600 font-black">
                  {formatCurrency(currentOrder?.totalFee || 324000)}
                </span>
              </div>

              {/* Point A */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm lấy hàng</div>
                  <div className="font-bold text-slate-800 line-clamp-1">
                    {currentOrder?.pickup.address || 'Kho CMT8, P.12, Quận 10'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {currentOrder?.pickup.contactName} • {currentOrder?.pickup.contactPhone}
                  </div>
                </div>
              </div>

              {/* Point B */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm giao hàng</div>
                  <div className="font-bold text-slate-800 line-clamp-1">
                    {currentOrder?.dropoff.address || 'Số 182 Hai Bà Trưng, P.Đa Kao, Quận 1'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {currentOrder?.dropoff.contactName} • {currentOrder?.dropoff.contactPhone}
                  </div>
                </div>
              </div>

              {/* Cargo specs */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Hàng hóa:</span>
                  <span className="font-bold text-slate-800">
                    {currentOrder?.cargo.name || 'Hàng gia dụng & Thiết bị'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Trọng lượng & Quy cách:</span>
                  <span className="font-bold text-slate-800">
                    {currentOrder?.cargo.weightKg || 350} kg • {currentOrder?.cargo.quantity || 1} kiện
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL BÁO CÁO SỰ CỐ (INCIDENT REPORTING - UC-CUS-15) */}
      {/* ========================================================================= */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowIncidentModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-slideRight">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Báo cáo sự cố chuyến đi (UC-CUS-15)
                  </h3>
                  <p className="text-[11px] text-rose-100">
                    Điều phối viên ModMove sẽ can thiệp xử lý ngay lập tức
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitIncident} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {incidentSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-black text-sm text-emerald-900">
                    Đã gửi báo cáo sự cố thành công!
                  </h4>
                  <p className="text-emerald-700 text-xs">
                    Mã sự cố đã được đồng bộ lên Ban Điều Phối. Chúng tôi sẽ liên hệ lại với bạn trong 5 phút.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select Incident Type according to SRS */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      Phân loại sự cố phát sinh <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'Delay', label: 'Chậm trễ (Delay)' },
                        { key: 'WrongRoute', label: 'Sai lộ trình (WrongRoute)' },
                        { key: 'DriverMisconduct', label: 'Thái độ tài xế' },
                        { key: 'CargoDamage', label: 'Hàng hư hại (CargoDamage)' },
                        { key: 'CargoLoss', label: 'Thất lạc hàng (CargoLoss)' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setIncidentType(item.key as any)}
                          className={`p-2.5 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                            incidentType === item.key
                              ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      Mô tả chi tiết sự việc <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      placeholder="Mô tả cụ thể thời gian, vị trí hoặc hành vi cần hỗ trợ xử lý..."
                      className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs text-slate-800"
                    />
                  </div>

                  {/* Upload Evidence Photos (up to 5 photos - GB-06 / UC-CUS-15) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800">
                        Hình ảnh bằng chứng hiện trường
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {incidentPhotos.length}/5 ảnh
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {incidentPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-2xs group"
                        >
                          <img src={photo} alt={`Bằng chứng ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveIncidentPhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {incidentPhotos.length < 5 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/50 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-rose-600">
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px] font-bold">Thêm ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUploadIncidentPhoto}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowIncidentModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingIncident}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-600/25 transition cursor-pointer"
                    >
                      {isSubmittingIncident ? (
                        <span>Đang gửi...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi báo cáo sự cố</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL 1: PHÊ DUYỆT TRƯỚC KHI KHỞI HÀNH (PICKUP CARGO VERIFICATION - UC-CUS-11/12) */}
      {/* ========================================================================= */}
      {showPickupProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowPickupProofModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-slideRight">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight text-white">
                    Kiểm tra ảnh hiện trạng trước khi khởi hành
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tài xế {driver.name} đã kiểm đếm và tải lên ảnh hàng hóa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPickupProofModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Gallery with Zoom & Comparison */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Vui lòng đối chiếu kỹ: chủng loại hàng, số lượng ({currentOrder?.cargo.quantity || 1} kiện) và quy cách chằng buộc an toàn trên thùng xe trước khi phê duyệt cho xe lăn bánh.
                </span>
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pickupEvidencePhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 shadow-2xs hover:shadow-md transition"
                  >
                    <div className="h-48 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={photoUrl}
                        alt={`Ảnh kiểm trạng ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    {/* Hover Zoom Overlay */}
                    <button
                      type="button"
                      onClick={() => setSelectedPickupZoomPhoto(photoUrl)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white font-bold text-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Phóng to xem chi tiết</span>
                    </button>
                    {/* Caption */}
                    <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {idx === 0 ? '1. Toàn cảnh kiện hàng tại điểm lấy' : '2. Hàng đã chằng buộc trên thùng xe'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        GB-11
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reject Reason input box (if customer clicked Reject) */}
              {showPickupRejectInput && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-slideRight">
                  <label className="block font-bold text-rose-800 text-xs">
                    Lý do từ chối ảnh hiện trạng (Bắt buộc theo MSG67):
                  </label>
                  <textarea
                    rows={2}
                    value={pickupRejectReason}
                    onChange={(e) => setPickupRejectReason(e.target.value)}
                    placeholder="Ví dụ: Ảnh bị mờ, thiếu góc chụp chằng buộc, hoặc hàng hóa có vết móp mới..."
                    className="w-full p-2.5 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-xs bg-white text-slate-800"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPickupRejectInput(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-[11px]"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectPickupEvidence}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs"
                    >
                      Xác nhận gửi từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions: 2 nút rõ ràng theo yêu cầu */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
              {!showPickupRejectInput ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPickupRejectInput(true)}
                    className="py-2.5 px-4 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Từ chối / Báo cáo bất thường</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprovePickupEvidence}
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Phê duyệt & Cho phép đi (InTransit)</span>
                  </button>
                </>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium">
                  Yêu cầu chụp lại ảnh sẽ được gửi trực tiếp vào ứng dụng Driver của tài xế.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL 2: XÁC NHẬN KHI GIAO ĐẾN NƠI (DELIVERY RECEIPT CONFIRMATION - UC-CUS-19) */}
      {/* ========================================================================= */}
      {showDeliveryReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowDeliveryReceiptModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-slideRight">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Xác nhận nhận hàng & Kiểm tra ảnh POD (UC-CUS-19)
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Tài xế {driver.name} đã hoàn tất bàn giao tại điểm giao {currentOrder?.dropoff.address}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliveryReceiptModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Tài xế đã tải lên hình ảnh biên bản giao nhận và ảnh chụp hàng hóa tại điểm đến (Proof Of Delivery - POD).
                </span>
              </div>

              {/* POD Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {deliveryPodPhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 shadow-2xs hover:shadow-md transition"
                  >
                    <div className="h-48 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={photoUrl}
                        alt={`Ảnh POD ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    {/* Hover Zoom Overlay */}
                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryZoomPhoto(photoUrl)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white font-bold text-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Phóng to xem chi tiết</span>
                    </button>
                    {/* Caption */}
                    <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {idx === 0 ? '1. Ảnh bàn giao hàng hóa tại điểm đến' : '2. Ảnh chữ ký / Biên bản giao nhận POD'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                        POD-VERIFIED
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Info Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-slate-900">Chi tiết đối soát đơn #{currentOrder?.code}:</div>
                <div className="flex justify-between text-slate-600">
                  <span>Người nhận hàng:</span>
                  <span className="font-bold text-slate-800">
                    {currentOrder?.dropoff.contactName} ({currentOrder?.dropoff.contactPhone})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tổng cước phí thanh toán:</span>
                  <span className="font-black text-brand-600">
                    {formatCurrency(currentOrder?.totalFee || 324000)} ({currentOrder?.paymentMethod === 'PayOS' ? 'Đã thanh toán PayOS' : 'Tiền mặt COD'})
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDeliveryReceiptModal(false);
                  setShowIncidentModal(true);
                }}
                className="py-2.5 px-4 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
              >
                Khiếu nại / Hàng có vấn đề
              </button>

              <button
                type="button"
                onClick={handleConfirmCargoReceipt}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Xác nhận đã nhận hàng (Completed)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL 3: ĐÁNH GIÁ CHUYẾN ĐI (TRIP RATING - UC-CUS-25) */}
      {/* ========================================================================= */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowRatingModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 p-5 space-y-4 animate-slideRight">
            {ratingSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="font-black text-lg text-slate-900">
                  Đánh giá thành công!
                </h3>
                <p className="text-xs text-slate-500">
                  Phản hồi của bạn đã được ghi nhận vào hồ sơ tài xế và hệ thống ModMove.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-4">
                <div className="text-center pb-2 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                  </div>
                  <h3 className="font-black text-base text-slate-900">
                    Đánh giá chuyến đi (UC-CUS-25)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tài xế {driver.name} • {driver.licensePlate}
                  </p>
                </div>

                {/* Star rating selector */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 transition hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingStars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs font-black text-amber-600">
                  {ratingStars === 5
                    ? 'Xuất sắc! (5/5 sao)'
                    : ratingStars === 4
                    ? 'Rất tốt (4/5 sao)'
                    : ratingStars === 3
                    ? 'Bình thường (3/5 sao)'
                    : 'Cần cải thiện'}
                </div>

                {/* Quick tags */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-700">Điểm nổi bật:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Đúng giờ',
                      'Bốc xếp cẩn thận',
                      'Thân thiện',
                      'Lái xe an toàn',
                      'Giao tiếp tốt',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleRatingTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          ratingTags.includes(tag)
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional comment */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Nhận xét thêm:</label>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Chia sẻ thêm trải nghiệm của bạn về dịch vụ..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. FULLSCREEN PHOTO ZOOM LIGHTBOX (For Pickup or Delivery Photos) */}
      {/* ========================================================================= */}
      {(selectedPickupZoomPhoto || selectedDeliveryZoomPhoto) && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setSelectedPickupZoomPhoto(null);
            setSelectedDeliveryZoomPhoto(null);
          }}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-orange-400 p-2 rounded-full bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPickupZoomPhoto || selectedDeliveryZoomPhoto || ''}
            alt="Phóng to ảnh"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-3 text-white text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Bấm vào bất kỳ đâu bên ngoài để đóng phóng to
          </div>
        </div>
      )}
    </div>
  );
};
