import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Truck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { msg } from '../../constants/messages';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useVehicleTypes } from '../../hooks/useDomainData';
import { orderService } from '../../services/order.service';
import { usePublicConfig } from '../../services/config.service';
import { errorMessage } from '../../services/mock/storage';
import { ShippingOrder } from '../../types/order.types';
import { formatCurrency, formatDistanceCeil } from '../../utils/format';
import { RouteStep } from '../../features/booking/steps/RouteStep';
import { CargoStep } from '../../features/booking/steps/CargoStep';
import { VehicleStep } from '../../features/booking/steps/VehicleStep';
import { PaymentStep } from '../../features/booking/steps/PaymentStep';
import { MapView } from '../../components/MapView';
import { FareSummary } from '../../features/booking/FareSummary';
import { canVehicleCarry } from '../../domain/vehicleFit';
import { ProhibitedCargoModal, WarrantyPolicyModal } from '../../features/booking/PolicyModals';
import { StepErrors, validateCargo, validateConfirm, validateRoute, validateVehicle } from '../../features/booking/bookingValidation';

const STEPS = [
  { num: 1, label: 'Lộ trình', sub: 'Điểm lấy – giao' },
  { num: 2, label: 'Hàng hoá', sub: 'Khai báo & ảnh' },
  { num: 3, label: 'Loại xe', sub: 'Phù hợp tải trọng' },
  { num: 4, label: 'Thanh toán', sub: 'Dịch vụ & xác nhận' },
];

/** Đặt xe 4 bước. Khách chưa đăng nhập vẫn lập được đơn nháp; khi gửi mới phải đăng nhập. */
export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { draft, step, restored, setStep, update, setPickup, setDropoff, setCargo, keepRestored, reset } = useBookingDraftStore();
  const vehicles = useVehicleTypes();
  const publicConfig = usePublicConfig();

  const [errors, setErrors] = useState<StepErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<'prohibited' | 'warranty' | null>(null);

  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof orderService.estimate>>>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  /** Tăng lên để báo giá lại (ví dụ giá vừa đổi lúc gửi đơn) */
  const [estimateNonce, setEstimateNonce] = useState(0);

  useEffect(() => {
    if (!draft.pickup.address || !draft.dropoff.address || !draft.vehicleTypeId) {
      setEstimate(null);
      setEstimateError(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    const t = setTimeout(() => {
      orderService
        .estimate(draft)
        .then((res) => {
          if (cancelled) return;
          setEstimate(res);
          setEstimateError(null);
        })
        .catch((e) => {
          if (cancelled) return;
          setEstimate(null);
          setEstimateError(errorMessage(e));
        })
        .finally(() => {
          if (!cancelled) setEstimating(false);
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateNonce, draft.pickup.address, draft.dropoff.address, draft.vehicleTypeId, draft.loadingService, draft.couponCode, draft.cargo.weightKg, draft.cargo.largestItem.lengthCm, draft.cargo.largestItem.widthCm, draft.cargo.largestItem.heightCm]);

  const validators: Record<number, () => StepErrors> = {
    1: () => validateRoute(draft),
    2: () => validateCargo(draft),
    3: () => validateVehicle(draft, vehicles),
    4: () => validateConfirm(draft),
  };

  /** Chỉ cho chuyển tới bước sau khi các bước trước hợp lệ */
  const goTo = (target: number) => {
    if (target <= step) {
      setErrors({});
      setStep(target);
      return;
    }
    for (let s = step; s < target; s++) {
      const e = validators[s]();
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setErrors({});
    setStep(target);
  };

  /** Đặt xong → trang chi tiết đơn; đơn chuyển khoản tự mở thanh toán */
  const finish = (order: ShippingOrder) => {
    reset();
    toast.success(msg('MSG33', { order_id: order.code }));
    navigate(`/orders/${order.id}${order.paymentMethod === 'PayOS' ? '?pay=1' : ''}`);
  };

  const handleSubmit = async () => {
    for (const s of [1, 2, 3, 4]) {
      const e = validators[s]();
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    // Chỉ khách đã đăng nhập mới gửi được đơn; nháp được giữ lại để gửi sau khi đăng nhập
    if (!isAuthenticated || !user) {
      toast.info(msg('MSG14'));
      navigate('/login?redirect=/booking');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await orderService.createOrder(draft, user, estimate?.fare.total);
      finish(order);
    } catch (e) {
      setSubmitError(errorMessage(e));
      // Giá vừa đổi: báo giá lại để khách thấy số mới rồi bấm gửi lần nữa
      if ((e as { code?: string }).code === 'FARE_CHANGED') setEstimateNonce((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === draft.vehicleTypeId);

  // Xe không phù hợp bị ẩn ở bước chọn xe: hàng khai lại không còn vừa xe đã chọn thì bỏ chọn để khách chọn lại
  const selectedNoLongerFits = Boolean(selectedVehicle && !canVehicleCarry(selectedVehicle, draft.cargo));
  useEffect(() => {
    if (selectedNoLongerFits) update({ vehicleTypeId: null });
  }, [selectedNoLongerFits, update]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto min-w-0">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
          <Truck className="w-4 h-4" />
        </div>
        <h1 className="text-base font-extrabold text-slate-900">Đặt xe vận chuyển</h1>
        {!isAuthenticated && <span className="ml-auto text-[11px] font-semibold text-slate-500">Bạn đang lập đơn nháp – cần đăng nhập khi gửi</span>}
      </header>

      {restored && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2 text-xs text-amber-900">
          <span className="font-semibold">Bạn có đơn nháp chưa gửi.</span>
          <span className="text-amber-800">Mã giảm giá và các ô đồng ý chính sách cần chọn lại.</span>
          <span className="ml-auto flex gap-2">
            <Button size="sm" onClick={keepRestored}>
              Tiếp tục
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                reset();
                setErrors({});
                setSubmitError(null);
              }}
            >
              Bắt đầu lại
            </Button>
          </span>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex-shrink-0" aria-label="Các bước đặt xe">
        <ol className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const active = s.num === step;
            const done = s.num < step;
            return (
              <li key={s.num}>
                <button
                  type="button"
                  onClick={() => goTo(s.num)}
                  aria-current={active ? 'step' : undefined}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                    active ? 'border-blue-600 bg-blue-50/50' : done ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {done ? <Check className="w-4 h-4" /> : s.num}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold text-slate-900">{s.label}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{s.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-5">
        <div className="space-y-4 min-w-0">
          {step === 1 && <RouteStep pickup={draft.pickup} dropoff={draft.dropoff} errors={errors} onPickup={setPickup} onDropoff={setDropoff} />}
          {step === 2 && (
            <CargoStep
              cargo={draft.cargo}
              errors={errors}
              onChange={setCargo}
            />
          )}
          {step === 3 && <VehicleStep vehicles={vehicles} cargo={draft.cargo} selectedId={draft.vehicleTypeId} errors={errors} onSelect={(id) => update({ vehicleTypeId: id })} />}
          {step === 4 && (
            <PaymentStep
              draft={draft}
              loadingFee={publicConfig?.loadingFee ?? estimate?.fare.loadingFee ?? 0}
              couponError={estimate?.couponError ?? null}
              discount={estimate?.fare.discount ?? 0}
              errors={errors}
              onChange={update}
              onShowWarranty={() => setModal('warranty')}
              onShowProhibited={() => setModal('prohibited')}
            />
          )}

          {step === 4 && estimateError && <Banner kind="error">Không tính được giá cước: {estimateError}</Banner>}
          {submitError && <Banner kind="error">{submitError}</Banner>}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="outline" onClick={() => goTo(step - 1)} disabled={step === 1}>
              Quay lại
            </Button>
            {step < 4 ? (
              <Button onClick={() => goTo(step + 1)}>
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={submitting || estimating} disabled={Boolean((estimate?.couponError && draft.couponCode) || estimateError || !estimate)}>
                {isAuthenticated ? `Gửi yêu cầu • ${formatCurrency(estimate?.fare.total ?? 0)}` : 'Đăng nhập để gửi yêu cầu'}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 h-fit space-y-4">
          <FareSummary fare={estimate?.fare ?? null} vehicle={selectedVehicle} couponCode={draft.couponCode} />
          {/* Hai điểm và đường đi lấy từ báo giá (BE tìm bằng MapVina); trước khi có báo giá thì dùng điểm khách chọn từ gợi ý */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Bản đồ lộ trình</h3>
            <MapView
              className="h-64"
              title="Lộ trình đặt xe"
              from={estimate?.route?.from ?? (draft.pickup.lat ? { lat: draft.pickup.lat, lng: draft.pickup.lng } : null)}
              to={estimate?.route?.to ?? (draft.dropoff.lat ? { lat: draft.dropoff.lat, lng: draft.dropoff.lng } : null)}
              routePolyline={estimate?.route ? estimate.route.polyline : undefined}
              fromText={draft.pickup.address}
              toText={draft.dropoff.address}
            />
            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" /> {draft.pickup.address || 'Chưa nhập điểm lấy'}
              </p>
              <p className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 flex-shrink-0" /> {draft.dropoff.address || 'Chưa nhập điểm giao'}
              </p>
              {estimate?.fare && (
                <p className="font-semibold text-slate-700">
                  Quãng đường: {formatDistanceCeil(estimate.fare.distanceKm)} • khoảng {estimate.fare.durationMins} phút
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <ProhibitedCargoModal open={modal === 'prohibited'} onClose={() => setModal(null)} />
      <WarrantyPolicyModal open={modal === 'warranty'} onClose={() => setModal(null)} />

    </div>
  );
};
