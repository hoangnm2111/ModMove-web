import React, { useState } from 'react';
import { orderService } from '../../services/order.service';
import { ShippingOrder } from '../../types/order.types';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { formatCurrency, formatDate, formatDistance } from '../../utils/format';
import { Package, Clock, MapPin, Truck, ChevronRight, CheckCircle2, Menu } from 'lucide-react';
import { Button } from '../../components/Button';
import { useCustomerLayout } from '../../layouts/CustomerLayout';

export const OrdersPage: React.FC = () => {
  const { toggleSidebar } = useCustomerLayout();
  const [orders] = useState<ShippingOrder[]>(() => orderService.getOrders());
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(orders[0] || null);

  const filteredOrders = orders.filter((o) => {
    if (selectedTab === 'ACTIVE') {
      return ['PlaceOrder', 'Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(o.status);
    }
    if (selectedTab === 'COMPLETED') {
      return ['Delivered', 'Completed'].includes(o.status);
    }
    if (selectedTab === 'CANCELLED') {
      return o.status === 'Cancelled';
    }
    return true;
  });

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Left List Pane */}
      <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        {/* Header Tabs */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                Lịch sử đơn vận chuyển
              </h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {orders.length} đơn
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang chạy' },
              { id: 'COMPLETED', label: 'Xong' },
              { id: 'CANCELLED', label: 'Hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-1.5 rounded-lg text-center transition ${
                  selectedTab === tab.id
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Order Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Không có đơn hàng nào trong mục này.</div>
          ) : (
            filteredOrders.map((o) => {
              const statusCfg = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.PlaceOrder;
              const isSelected = selectedOrder?.id === o.id;

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-900 tracking-wide">{o.code}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Route summary */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></span>
                      <span className="text-slate-700 line-clamp-1">{o.pickup.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0"></span>
                      <span className="text-slate-700 line-clamp-1">{o.dropoff.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> {formatDate(o.createdAt)}
                    </span>
                    <span className="font-extrabold text-brand-600">{formatCurrency(o.totalFee)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedOrder ? (
          <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-extrabold text-slate-800">Chi tiết đơn {selectedOrder.code}</h1>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      ORDER_STATUS_CONFIG[selectedOrder.status].bg
                    } ${ORDER_STATUS_CONFIG[selectedOrder.status].text} ${
                      ORDER_STATUS_CONFIG[selectedOrder.status].border
                    }`}
                  >
                    {ORDER_STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Khởi tạo lúc: {formatDate(selectedOrder.createdAt)}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Tổng thanh toán:</div>
                <div className="text-2xl font-black text-brand-600">{formatCurrency(selectedOrder.totalFee)}</div>
              </div>
            </div>

            {/* Stepper Status Progression */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Tiến độ hành trình vận chuyển:
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Đã đặt đơn', done: true },
                  { label: 'Tài xế nhận', done: selectedOrder.status !== 'PlaceOrder' },
                  { label: 'Đang giao hàng', done: ['InTransit', 'Delivered', 'Completed'].includes(selectedOrder.status) },
                  { label: 'Hoàn tất bàn giao', done: ['Delivered', 'Completed'].includes(selectedOrder.status) },
                ].map((s, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                        s.done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {s.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-medium ${s.done ? 'text-slate-800' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Driver Card */}
            {selectedOrder.assignedDriver ? (
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedOrder.assignedDriver.avatar}
                    alt={selectedOrder.assignedDriver.name}
                    className="w-12 h-12 rounded-full border-2 border-brand-500 object-cover"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">{selectedOrder.assignedDriver.name}</div>
                    <div className="text-xs text-slate-600">
                      Biển số: <span className="font-mono font-bold text-slate-800">{selectedOrder.assignedDriver.licensePlate}</span> • ⭐ {selectedOrder.assignedDriver.rating}
                    </div>
                    <div className="text-[11px] text-brand-600 font-medium">SĐT: {selectedOrder.assignedDriver.phone}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Gọi điện</Button>
                  <Button variant="primary" size="sm">Nhắn tin</Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                Hệ thống đang phát tín hiệu điều xe xung quanh khu vực lấy hàng...
              </div>
            )}

            {/* Route & Cargo Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Thông tin Lộ trình</div>
                <div>
                  <div className="text-slate-400 text-[10px]">ĐIỂM LẤY HÀNG:</div>
                  <div className="font-semibold text-slate-800">{selectedOrder.pickup.address}</div>
                  <div className="text-slate-500">Liên hệ: {selectedOrder.pickup.contactName} ({selectedOrder.pickup.contactPhone})</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ĐIỂM GIAO HÀNG:</div>
                  <div className="font-semibold text-slate-800">{selectedOrder.dropoff.address}</div>
                  <div className="text-slate-500">Người nhận: {selectedOrder.dropoff.contactName} ({selectedOrder.dropoff.contactPhone})</div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-500">
                  Khoảng cách: <span className="font-bold text-slate-800">{formatDistance(selectedOrder.totalDistanceKm)}</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Hàng hóa & Phương tiện</div>
                <div>
                  <div className="text-slate-400 text-[10px]">LOẠI PHƯƠNG TIỆN:</div>
                  <div className="font-semibold text-slate-800">{selectedOrder.vehicle.name} ({selectedOrder.vehicle.capacityText})</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">MÔ TẢ ĐỒ ĐẠC:</div>
                  <div className="text-slate-700">{selectedOrder.cargo.name}</div>
                </div>
                {selectedOrder.cargo.aiNotes && (
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px]">
                    {selectedOrder.cargo.aiNotes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">Chọn một đơn hàng để xem chi tiết</div>
        )}
      </div>
    </div>
  );
};
