import React, { useState } from 'react';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { Radio, AlertTriangle, Search, CheckCircle2, Navigation } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { ShippingOrder } from '../../types/order.types';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { formatCurrency, formatDistance } from '../../utils/format';

export const LiveMapPage: React.FC = () => {
  const [orders] = useState<ShippingOrder[]>(() => orderService.getOrders());
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(orders[0] || null);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Active Trips List */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10 flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-500 animate-pulse" />
              Giám sát hạm đội xe trực tiếp
            </h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              4 xe online
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn hoặc biển số..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Active Operational Alerts Banner */}
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Có 1 xe dừng quá 10 phút tại Hòa Lạc</span>
          </div>
          <span className="font-bold text-[10px] text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
            Cảnh báo
          </span>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {orders.map((o) => {
            const isSelected = selectedOrder?.id === o.id;
            const statusCfg = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.PlaceOrder;

            return (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                  isSelected ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">{o.code}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                <div className="text-xs text-slate-600 truncate">{o.pickup.address}</div>
                <div className="text-xs text-slate-600 truncate">➜ {o.dropoff.address}</div>

                {o.assignedDriver && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Tài xế: {o.assignedDriver.name}</span>
                    <span className="font-mono text-slate-500">{o.assignedDriver.licensePlate}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Map Canvas */}
      <div className="flex-1 h-full relative">
        <MapPlaceholder
          pickup={selectedOrder?.pickup}
          dropoff={selectedOrder?.dropoff}
          showActiveDrivers={true}
        />
      </div>
    </div>
  );
};
