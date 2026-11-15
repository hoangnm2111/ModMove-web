import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Truck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card, DataState, Empty, KV, PageShell, StatusPill, cx } from '../../components/ui/kit';
import { customerApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { TrackingCard } from './OrderDetailPage';
import { formatCurrency } from '../../utils/format';

const TRACKABLE = ['Accepted', 'Arrived', 'PickedUp', 'InTransit'];

/** UC-CUS-13/14 – Theo dõi trực tiếp các đơn đang chạy: GET /customer/Orders?view=Active + /{id}/tracking */
export const LiveTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const active = useQuery(() => customerApi.orders({ view: 'Active', pageSize: 50 }), [], { refreshMs: 30_000 });
  const items = active.data?.items ?? [];
  const selectedId = Number(params.get('order')) || items[0]?.id || 0;

  useEffect(() => {
    if (!params.get('order') && items[0]) setParams({ order: String(items[0].id) }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <PageShell title="Theo dõi trực tiếp" subtitle="Vị trí tài xế, thời gian dự kiến và tiến trình các đơn đang thực hiện">
      <DataState q={active}>
        {() =>
          items.length === 0 ? (
            <Empty
              text="Bạn không có đơn nào đang thực hiện."
              action={
                <Button size="sm" onClick={() => navigate('/booking')}>
                  Đặt xe ngay
                </Button>
              }
            />
          ) : (
            <div className="w-full grid lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                {items.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setParams({ order: String(o.id) })}
                    className={cx('w-full text-left bg-white border rounded-2xl p-3 transition', o.id === selectedId ? 'border-blue-600 ring-2 ring-blue-600/15' : 'border-slate-200 hover:border-slate-400')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{o.orderCode}</span>
                      <StatusPill status={o.orderStatus} paymentMethod={o.paymentMethod} paymentStatus={o.paymentStatus} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate flex gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" /> {o.dropoffAddress}
                    </div>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2">{selectedId > 0 && <Tracked id={selectedId} />}</div>
            </div>
          )
        }
      </DataState>
    </PageShell>
  );
};

const Tracked: React.FC<{ id: number }> = ({ id }) => {
  const navigate = useNavigate();
  const order = useQuery(() => customerApi.order(id), [id], { refreshMs: 20_000 });
  const o = order.data;
  const tracking = useQuery(() => customerApi.tracking(id), [id, o?.orderStatus], { enabled: !!o && TRACKABLE.includes(o.orderStatus), refreshMs: 60_000 });
  if (!o) return <DataState q={order}>{() => null}</DataState>;
  return (
    <div className="space-y-4">
      {TRACKABLE.includes(o.orderStatus) ? (
        <TrackingCard tracking={tracking.data} error={tracking.error} loading={tracking.loading} onRefresh={() => void tracking.reload()} />
      ) : (
        <Card title="Trạng thái">
          <p className="text-sm text-slate-600">
            Đơn đang <StatusPill status={o.orderStatus} paymentMethod={o.paymentMethod} paymentStatus={o.paymentStatus} />.{' '}
            {o.orderStatus === 'Pending' && (o.paymentMethod === 'PayOS' && o.paymentStatus === 'Unpaid' ? 'Hãy thanh toán để bắt đầu tìm tài xế.' : 'Hệ thống đang tìm tài xế gần bạn.')}
            {o.orderStatus === 'Delivered' && 'Hàng đã giao, hãy xác nhận đã nhận hàng hoặc khiếu nại trong 24 giờ.'}
          </p>
        </Card>
      )}
      <Card
        title={`Đơn ${o.orderCode}`}
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${o.id}`)}>
            Chi tiết & thao tác
          </Button>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <KV label="Điểm lấy">{o.pickupAddress}</KV>
            <KV label="Điểm giao">{o.dropoffAddress}</KV>
            <KV label="Tổng cước">{formatCurrency(o.totalFee)}</KV>
          </div>
          <div>
            {o.driver ? (
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm truncate">{o.driver.fullName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{o.driver.licensePlate}</div>
                  <div className="text-xs text-slate-700 font-semibold mt-0.5">{o.driver.phoneNumber}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có tài xế.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
