import React, { useRef, useState } from 'react';
import { AlertTriangle, Camera, Clock, Navigation, RefreshCw, Truck, Users } from 'lucide-react';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { ORDER_STATUS } from '../../api/labels';
import type { OrderStatus } from '../../api/types';
import { Card, DataState, PageShell, Pager, SearchBox, StatCard, StatusPill, Table, cx } from '../../components/ui/kit';
import { MapEmbed } from '../../components/MapEmbed';
import { DispatcherOrderDrawer } from '../../features/dispatcher/DispatcherOrderDrawer';
import { IncidentDrawer } from '../../features/dispatcher/IncidentDrawer';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';
import { useDriverLocations, useNotificationRefresh } from '../../hooks/useRealtime';

const SUMMARY_KEYS: { key: OrderStatus | 'ALL'; field: keyof import('../../api/types').DispatcherOrdersSummaryResponse }[] = [
  { key: 'ALL', field: 'total' },
  { key: 'Pending', field: 'pending' },
  { key: 'Accepted', field: 'accepted' },
  { key: 'Arrived', field: 'arrived' },
  { key: 'PickedUp', field: 'pickedUp' },
  { key: 'InTransit', field: 'inTransit' },
  { key: 'Delivered', field: 'delivered' },
  { key: 'Completed', field: 'completed' },
  { key: 'Cancelled', field: 'cancelled' },
];

/** UC-DIS-01 – Giám sát đơn từ Pending tới Completed và tài xế đang Online */
export const LiveMapPage: React.FC = () => {
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);

  const summary = useQuery(() => dispatcherApi.ordersSummary(), [], { refreshMs: 30_000 });
  const filters = { status: status === 'ALL' ? undefined : status, search: search.trim(), from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined };
  const orders = useQuery(() => dispatcherApi.orders({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page], { refreshMs: 30_000 });
  const drivers = useQuery(() => dispatcherApi.onlineDrivers(), [], { refreshMs: 30_000 });
  // Thông báo mới (đơn, sự cố, khiếu nại) → tải lại bảng giám sát ngay, không chờ 30 giây
  useNotificationRefresh(() => (void summary.reload(), void orders.reload()));
  // GPS tài xế realtime: đổi tọa độ ngay; tài xế chưa có trong danh sách thì tải lại (tối đa mỗi 10 giây)
  const lastReload = useRef(0);
  useDriverLocations((e) => {
    if (drivers.data?.some((d) => d.driverProfileId === e.driverProfileId)) {
      drivers.setData((list) => list?.map((d) => (d.driverProfileId === e.driverProfileId ? { ...d, latitude: e.latitude, longitude: e.longitude, lastLocationAt: e.at } : d)));
    } else if (Date.now() - lastReload.current > 10_000) {
      lastReload.current = Date.now();
      void drivers.reload();
    }
  });

  const driverList = drivers.data ?? [];
  const selDriver = driverList.find((d) => d.driverProfileId === driverId) ?? driverList[0];
  const busyCount = driverList.filter((d) => d.activeOrderId).length;

  return (
    <PageShell
      title="Giám sát vận hành"
      subtitle="Theo dõi mọi đơn hàng và tài xế đang trực tuyến – tự cập nhật mỗi 30 giây"
      actions={
        <button onClick={() => (summary.reload(), orders.reload(), drivers.reload())} className="text-xs font-bold text-blue-600 flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      }
    >
      <div className="w-full space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {SUMMARY_KEYS.map(({ key, field }) => (
            <button
              key={key}
              onClick={() => (setStatus(key), setPage(1))}
              className={cx('rounded-2xl border p-3 text-left transition bg-white', status === key ? 'border-blue-600 ring-2 ring-blue-600/15' : 'border-slate-200 hover:border-slate-400')}
            >
              <div className="text-[10px] font-bold uppercase text-slate-500 truncate">{key === 'ALL' ? 'Tất cả' : ORDER_STATUS[key].label}</div>
              <div className="text-xl font-black text-slate-900">{summary.data ? summary.data[field] : '…'}</div>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <StatCard label="Tài xế online (GPS ≤ 5')" value={driverList.length} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Đang chạy đơn" value={busyCount} icon={<Truck className="w-5 h-5" />} accent="bg-sky-50 text-sky-600" />
          <StatCard label="Rảnh, chờ đơn" value={driverList.length - busyCount} icon={<Navigation className="w-5 h-5" />} accent="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="grid xl:grid-cols-3 gap-4">
          <Card
            className="xl:col-span-2"
            title={`Đơn hàng${status !== 'ALL' ? ` – ${ORDER_STATUS[status].label}` : ''}`}
            actions={
              <div className="flex flex-wrap gap-2 items-center">
                <SearchBox value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Mã đơn, số điện thoại khách, tài xế, biển số…" />
                <input type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} className="py-2 px-2 rounded-xl border border-slate-200 text-xs" aria-label="Từ ngày" />
                <input type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} className="py-2 px-2 rounded-xl border border-slate-200 text-xs" aria-label="Đến ngày" />
              </div>
            }
          >
            <DataState q={orders} empty={(d) => d.items.length === 0}>
              {(d) => (
                <>
                  <Table
                    rows={d.items}
                    rowKey={(r) => r.id}
                    onRow={(r) => setOrderId(r.id)}
                    cols={[
                      {
                        head: 'Đơn',
                        cell: (r) => (
                          <div>
                            <div className="font-black text-slate-900">{r.orderCode}</div>
                            <div className="text-[11px] text-slate-400">{formatDateTime(r.createdAt)}</div>
                          </div>
                        ),
                      },
                      {
                        head: 'Trạng thái',
                        cell: (r) => (
                          <div className="space-y-1">
                            <StatusPill status={r.orderStatus} paymentMethod={r.paymentMethod} paymentStatus={r.paymentStatus} />
                            <div className="flex flex-wrap gap-1">
                              {r.matchingTimeoutSoon && (
                                <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> Sắp hết 10'
                                </span>
                              )}
                              {r.awaitingPickupApproval && (
                                <span className="text-[10px] font-bold text-purple-700 flex items-center gap-0.5">
                                  <Camera className="w-3 h-3" /> Chờ khách duyệt ảnh
                                </span>
                              )}
                              {r.openIncidentId && (
                                <button
                                  onClick={(e) => (e.stopPropagation(), setIncidentId(r.openIncidentId))}
                                  className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5 hover:underline"
                                >
                                  <AlertTriangle className="w-3 h-3" /> Sự cố #{r.openIncidentId}
                                </button>
                              )}
                            </div>
                          </div>
                        ),
                      },
                      {
                        head: 'Khách',
                        cell: (r) => (
                          <div>
                            <div className="font-semibold">{r.customerName}</div>
                            <div className="text-[11px] text-slate-400"><PhoneLink phone={r.customerPhone} /></div>
                          </div>
                        ),
                      },
                      {
                        head: 'Tài xế',
                        cell: (r) =>
                          r.driverName ? (
                            <div>
                              <div className="font-semibold">{r.driverName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{r.licensePlate}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          ),
                      },
                      { head: 'Tuyến', cell: (r) => <div className="max-w-[220px] truncate text-slate-600" title={`${r.pickupAddress} – ${r.dropoffAddress}`}>{r.pickupAddress} – {r.dropoffAddress}</div> },
                      {
                        head: 'Cước',
                        className: 'text-right',
                        cell: (r) => (
                          <div>
                            <div className="font-black">{formatCurrency(r.totalFee)}</div>
                            <div className="text-[11px] text-slate-400">
                              {r.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'} • {r.paymentStatus === 'Paid' ? 'Đã trả' : 'Chưa trả'}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                  <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
                </>
              )}
            </DataState>
          </Card>

          <Card title={`Tài xế online (${driverList.length})`} padded={false}>
            <div className="p-3">
              <MapEmbed className="h-56" point={selDriver ? { lat: selDriver.latitude, lng: selDriver.longitude } : null} title="Vị trí tài xế" />
            </div>
            <DataState q={drivers} empty={(d) => d.length === 0}>
              {(list) => (
                <ul className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {list.map((d) => (
                    <li key={d.driverProfileId}>
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setDriverId(d.driverProfileId)}
                        onClick={() => setDriverId(d.driverProfileId)}
                        className={cx('w-full text-left px-4 py-2.5 text-xs flex gap-2 items-center', selDriver?.driverProfileId === d.driverProfileId ? 'bg-blue-50' : 'hover:bg-slate-50')}
                      >
                        <span className={cx('w-2 h-2 rounded-full flex-shrink-0', d.activeOrderId ? 'bg-sky-500' : 'bg-emerald-500')} />
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-900 truncate">{d.fullName}</div>
                          <div className="text-slate-500 truncate">
                            <span className="font-mono">{d.licensePlate}</span> • {d.vehicleTypeName} • <PhoneLink phone={d.phoneNumber} />
                          </div>
                          <div className="text-slate-400">GPS {timeAgo(d.lastLocationAt)}</div>
                        </div>
                        {d.activeOrderId ? (
                          <span
                            role="button"
                            onClick={(e) => (e.stopPropagation(), setOrderId(d.activeOrderId))}
                            className="text-right text-[11px] font-bold text-blue-700 hover:underline"
                          >
                            {d.activeOrderCode}
                            <br />
                            {d.activeOrderStatus && ORDER_STATUS[d.activeOrderStatus].label}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">Rảnh</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          </Card>
        </div>
      </div>

      {orderId && <DispatcherOrderDrawer orderId={orderId} onClose={() => setOrderId(null)} onOpenIncident={(id) => (setOrderId(null), setIncidentId(id))} />}
      {incidentId && (
        <IncidentDrawer
          incidentId={incidentId}
          onClose={() => setIncidentId(null)}
          onChanged={() => (orders.reload(), summary.reload())}
          onOpenOrder={(id) => (setIncidentId(null), setOrderId(id))}
        />
      )}
    </PageShell>
  );
};
