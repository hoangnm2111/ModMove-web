import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/order.service';
import { ShippingOrder, OrderStatus } from '../../types/order.types';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { formatCurrency } from '../../utils/format';
import {
  Search,
  Calendar,
  Tag,
  Download,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  X,
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Package,
  Radio,
} from 'lucide-react';
import { useCustomerLayout } from '../../layouts/CustomerLayout';
import { useOrderStore } from '../../store/useOrderStore';

// Tabs strictly following the Order Lifecycle in Report-3 SRS:
// Pending (PlaceOrder) -> Accepted -> Arrived -> PickedUp -> InTransit -> Delivered -> Completed | Cancelled
type TabKey =
  | 'ALL'
  | 'PlaceOrder'
  | 'Accepted'
  | 'Arrived'
  | 'PickedUp'
  | 'InTransit'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

interface TabItem {
  key: TabKey;
  label: string;
}

const SRS_STATUS_TABS: TabItem[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PlaceOrder', label: 'Đang tìm tài xế' },
  { key: 'Accepted', label: 'Đã nhận đơn' },
  { key: 'Arrived', label: 'Đã đến điểm lấy' },
  { key: 'PickedUp', label: 'Đã lấy hàng' },
  { key: 'InTransit', label: 'Đang giao' },
  { key: 'Delivered', label: 'Đã giao' },
  { key: 'Completed', label: 'Hoàn thành' },
  { key: 'Cancelled', label: 'Đã huỷ' },
];

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toggleSidebar } = useCustomerLayout();
  const { setPickup, setDropoff } = useOrderStore();

  const [orders] = useState<ShippingOrder[]>(() => orderService.getOrders());
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('ALL');

  // Drawer / Modal detail view
  const [detailOrder, setDetailOrder] = useState<ShippingOrder | null>(null);

  // Copied feedback tooltip
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReorder = (order: ShippingOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setPickup({
      address: order.pickup.address,
      lat: order.pickup.lat,
      lng: order.pickup.lng,
      contactName: order.pickup.contactName,
      contactPhone: order.pickup.contactPhone,
    });
    setDropoff({
      address: order.dropoff.address,
      lat: order.dropoff.lat,
      lng: order.dropoff.lng,
      contactName: order.dropoff.contactName,
      contactPhone: order.dropoff.contactPhone,
    });
    navigate('/booking');
  };

  // Export to CSV
  const handleExportData = () => {
    const headers = [
      'Mã đơn',
      'Dịch vụ',
      'Điểm lấy hàng',
      'Điểm giao hàng',
      'Thời gian tạo',
      'Tổng COD',
      'Tổng phí',
      'Trạng thái',
      'Phương thức TT',
    ];

    const rows = filteredOrders.map((o) => [
      o.code,
      `"${o.vehicle.name}"`,
      `"${o.pickup.address.replace(/"/g, '""')}"`,
      `"${o.dropoff.address.replace(/"/g, '""')}"`,
      formatDateTime(o.createdAt),
      o.codAmount || 0,
      o.totalFee,
      ORDER_STATUS_CONFIG[o.status]?.label || o.status,
      o.paymentMethod,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ModMove_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date time: 26-10-2026, 23:18
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year}, ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab filter (SRS OrderStatus)
      if (activeTab !== 'ALL') {
        if (activeTab === 'PlaceOrder') {
          if (o.status !== 'PlaceOrder' && o.status !== 'Pending') return false;
        } else if (o.status !== activeTab) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = o.code.toLowerCase().includes(q);
        const matchPickup = o.pickup.address.toLowerCase().includes(q);
        const matchDropoff = o.dropoff.address.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        if (!matchCode && !matchPickup && !matchDropoff && !matchCustomer) return false;
      }

      // 3. Tag / Service filter
      if (selectedTag !== 'ALL') {
        if (selectedTag === 'BIKE' && o.vehicle.category !== 'BIKE') return false;
        if (selectedTag === 'VAN' && o.vehicle.category !== 'VAN') return false;
        if (selectedTag === 'TRUCK' && !o.vehicle.category.includes('TRUCK')) return false;
      }

      // 4. Time range filter
      if (selectedTimeRange !== 'ALL') {
        const orderTime = new Date(o.createdAt).getTime();
        const now = Date.now();
        if (selectedTimeRange === 'TODAY' && now - orderTime > 86400000) return false;
        if (selectedTimeRange === 'WEEK' && now - orderTime > 86400000 * 7) return false;
        if (selectedTimeRange === 'MONTH' && now - orderTime > 86400000 * 30) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, selectedTag, selectedTimeRange]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: TITLE & EXPORT BUTTON */}
      {/* ========================================================================= */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Lịch sử đơn hàng
        </h1>

        <button
          type="button"
          onClick={handleExportData}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer hover:border-slate-300"
          title="Tải về file Excel/CSV"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Xuất dữ liệu</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL STATUS TABS (SRS LIFECYCLE - AHAMOVE TAB STYLE) */}
      {/* ========================================================================= */}
      <div className="px-6 border-b border-slate-200 flex-shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 text-xs sm:text-sm whitespace-nowrap min-w-max">
          {SRS_STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 font-bold transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-brand-500 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER BAR: SEARCH, TIME, TAGS */}
      {/* ========================================================================= */}
      <div className="px-6 py-3.5 flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white flex-shrink-0">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hàng"
            className="w-full pl-9 pr-3 py-2 bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl outline-none focus:border-brand-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="appearance-none pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl outline-none cursor-pointer transition shadow-xs"
          >
            <option value="ALL">Thời gian: Tất cả</option>
            <option value="TODAY">Hôm nay</option>
            <option value="WEEK">7 ngày qua</option>
            <option value="MONTH">30 ngày qua</option>
          </select>
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Tags / Service Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="appearance-none pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl outline-none cursor-pointer transition shadow-xs"
          >
            <option value="ALL">Tags: Tất cả dịch vụ</option>
            <option value="BIKE">Xe máy</option>
            <option value="VAN">Xe bán tải 500kg</option>
            <option value="TRUCK">Xe tải 1 - 2 tấn</option>
          </select>
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ORDERS DATA TABLE (EXACTLY MATCHING AHAMOVE IMAGE) */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
              <th className="py-3 px-4 w-[16%]">Mã đơn</th>
              <th className="py-3 px-4 w-[24%]">Điểm lấy hàng</th>
              <th className="py-3 px-4 w-[24%]">Điểm giao hàng</th>
              <th className="py-3 px-4 w-[13%]">Thời gian tạo</th>
              <th className="py-3 px-4 w-[7%] text-center">Tổng COD</th>
              <th className="py-3 px-4 w-[9%] text-right">Tổng phí</th>
              <th className="py-3 px-4 w-[10%] text-center">Trạng thái</th>
              <th className="py-3 px-4 w-[7%] text-center">Thao tác</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-10 h-10 text-slate-300 stroke-1" />
                    <span className="text-xs sm:text-sm font-semibold">
                      Không tìm thấy đơn hàng nào phù hợp
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hãy thử đổi bộ lọc hoặc tạo đơn giao hàng mới
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusCfg =
                  ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PlaceOrder;

                return (
                  <tr
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    {/* Cột 1: Mã đơn */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-brand-600 hover:underline">
                          #{order.code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(order.code, e)}
                          className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded cursor-pointer"
                          title="Sao chép mã đơn"
                        >
                          {copiedCode === order.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                        {order.vehicle.name}
                      </div>
                    </td>

                    {/* Cột 2: Điểm lấy hàng */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {order.pickup.address}
                      </div>
                    </td>

                    {/* Cột 3: Điểm giao hàng */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {order.dropoff.address}
                      </div>
                    </td>

                    {/* Cột 4: Thời gian tạo */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-600 font-medium text-[11px]">
                      {formatDateTime(order.createdAt)}
                    </td>

                    {/* Cột 5: Tổng COD */}
                    <td className="py-3.5 px-4 align-top text-center font-bold text-slate-700">
                      {order.codAmount && order.codAmount > 0 ? (
                        formatCurrency(order.codAmount)
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Cột 6: Tổng phí */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="font-extrabold text-brand-600 flex items-center justify-end gap-1">
                        <span className="text-xs">💵</span>
                        <span>{formatCurrency(order.totalFee)}</span>
                      </div>
                    </td>

                    {/* Cột 7: Trạng thái (SRS status badges) */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Cột 8: Thao tác (Reorder & Details & Live Tracking) */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(order.status) && (
                          <button
                            type="button"
                            onClick={() => navigate(`/tracking?order=${order.code}`)}
                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-emerald-200"
                            title="Theo dõi vị trí trực tiếp"
                          >
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span>Theo dõi</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleReorder(order, e)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                          title="Đặt lại chuyến này"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết đơn"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER DETAIL MODAL / DRAWER (UC-CUS-17: View Delivery Details) */}
      {/* ========================================================================= */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setDetailOrder(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-out Drawer */}
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-slideRight">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base">
                  Chi tiết đơn #{detailOrder.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    ORDER_STATUS_CONFIG[detailOrder.status]?.bg
                  } ${ORDER_STATUS_CONFIG[detailOrder.status]?.text} ${
                    ORDER_STATUS_CONFIG[detailOrder.status]?.border
                  }`}
                >
                  {ORDER_STATUS_CONFIG[detailOrder.status]?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Card 1: Dịch vụ & Tuyến đường */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-slate-900">
                    {detailOrder.vehicle.name}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {detailOrder.totalDistanceKm} km • ~{detailOrder.estimatedDurationMins} phút
                  </span>
                </div>

                {/* Pickup & Dropoff addresses */}
                <div className="space-y-3 pt-2 border-t border-slate-200/70">
                  <div className="flex items-start gap-2.5">
                    <div className="w-3 h-3 rounded-full border-2 border-slate-900 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Điểm lấy hàng
                      </div>
                      <div className="font-bold text-slate-800">{detailOrder.pickup.address}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{detailOrder.pickup.contactName}</span>
                        <span>•</span>
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{detailOrder.pickup.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-3 h-3 rounded-sm bg-brand-500 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Điểm giao hàng
                      </div>
                      <div className="font-bold text-slate-800">{detailOrder.dropoff.address}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{detailOrder.dropoff.contactName}</span>
                        <span>•</span>
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{detailOrder.dropoff.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông tin hàng hóa & AI Analysis */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5 shadow-xs">
                <div className="font-extrabold text-slate-900 flex items-center justify-between">
                  <span>Thông tin hàng hóa</span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {detailOrder.cargo.weightKg} kg • {detailOrder.cargo.quantity} kiện
                  </span>
                </div>
                <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {detailOrder.cargo.name}
                </div>
                {detailOrder.cargo.aiNotes && (
                  <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-[11px] text-brand-800 flex items-start gap-2">
                    <span className="text-xs">🤖</span>
                    <div>
                      <span className="font-bold">Gợi ý từ AI:</span> {detailOrder.cargo.aiNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Tài xế phụ trách (nếu đã nhận đơn) */}
              {detailOrder.assignedDriver ? (
                <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                  <div className="font-extrabold text-slate-900">Tài xế phụ trách</div>
                  <div className="flex items-center gap-3">
                    <img
                      src={detailOrder.assignedDriver.avatar}
                      alt={detailOrder.assignedDriver.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">
                        {detailOrder.assignedDriver.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Biển số: {detailOrder.assignedDriver.licensePlate} • ⭐{' '}
                        {detailOrder.assignedDriver.rating}
                      </div>
                    </div>
                    <a
                      href={`tel:${detailOrder.assignedDriver.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Hệ thống đang tiến hành điều phối tài xế gần bạn nhất...</span>
                </div>
              )}

              {/* Card 4: Chi tiết cước phí & Thanh toán */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                <div className="font-extrabold text-slate-900 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Chi tiết thanh toán</span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {detailOrder.paymentMethod === 'PayOS' ? 'VietQR PayOS' : 'Tiền mặt COD'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Cước phí cơ bản:</span>
                    <span className="font-semibold">{formatCurrency(detailOrder.baseFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cước cự ly ({detailOrder.totalDistanceKm} km):</span>
                    <span className="font-semibold">{formatCurrency(detailOrder.distanceFee)}</span>
                  </div>
                  {detailOrder.servicesFee > 0 && (
                    <div className="flex justify-between">
                      <span>Dịch vụ bốc xếp / phụ kiện:</span>
                      <span className="font-semibold">
                        +{formatCurrency(detailOrder.servicesFee)}
                      </span>
                    </div>
                  )}
                  {detailOrder.discountFee > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Khuyến mãi / Giảm giá:</span>
                      <span>-{formatCurrency(detailOrder.discountFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-xs sm:text-sm font-extrabold text-slate-900">
                    <span>Tổng cước phí:</span>
                    <span className="text-brand-600 font-black">
                      {formatCurrency(detailOrder.totalFee)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5 flex-shrink-0">
              {['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(detailOrder.status) && (
                <button
                  type="button"
                  onClick={() => navigate(`/tracking?order=${detailOrder.code}`)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Theo dõi vị trí xe</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleReorder(detailOrder, {} as any)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Đặt lại đơn này</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
