import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Truck,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Upload,
  Info,
  DollarSign,
  QrCode,
  Banknote,
  Wallet,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { DEFAULT_VEHICLES } from '../../constants';
import { formatCurrency, formatDistance } from '../../utils/format';
import { Button } from '../../components/Button';
import { orderService } from '../../services/order.service';
import { ShippingOrder } from '../../types/order.types';

export const BookingWizard: React.FC = () => {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    selectedVehicle,
    setVehicle,
    cargo,
    setCargo,
    services,
    toggleService,
    promoCode,
    setPromoCode,
    paymentMethod,
    setPaymentMethod,
    calculateFare,
    triggerAiAnalysis,
    isAiAnalyzing,
    resetBooking,
  } = useOrderStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fare = calculateFare();

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newOrder: ShippingOrder = {
      id: `ord_${Date.now()}`,
      code: `MM-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: pickup.contactName || 'Hoàng Nguyễn Mạnh',
      customerPhone: pickup.contactPhone || '0338967316',
      pickup,
      dropoff,
      vehicle: selectedVehicle,
      cargo,
      additionalServices: services.filter((s) => s.isSelected),
      totalDistanceKm: fare.distanceKm,
      estimatedDurationMins: Math.round(fare.distanceKm * 2.5),
      baseFee: fare.baseFee,
      distanceFee: fare.distanceFee,
      servicesFee: fare.servicesFee,
      discountFee: fare.discountFee,
      totalFee: fare.totalFee,
      status: 'PlaceOrder',
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Unpaid' : 'Paid',
      createdAt: new Date().toISOString(),
    };

    orderService.saveOrder(newOrder);
    setIsSubmitting(false);
    resetBooking();
    navigate('/orders');
  };

  return (
    <div className="w-[450px] bg-white h-full border-r border-slate-200 flex flex-col shadow-xl z-20 flex-shrink-0">
      {/* Top Header Steps */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>BƯỚC {step}/4: {step === 1 ? 'Địa chỉ' : step === 2 ? 'Chọn loại xe' : step === 3 ? 'Hàng hóa & AI' : 'Thanh toán'}</span>
          <span className="text-brand-600 font-bold">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Wizard Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* STEP 1: Addresses */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Điểm lấy hàng (Pickup)
              </h2>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Địa chỉ chi tiết (số nhà, ngõ, đường)"
                  value={pickup.address}
                  onChange={(e) => setPickup({ address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên người gửi"
                    value={pickup.contactName}
                    onChange={(e) => setPickup({ contactName: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={pickup.contactPhone}
                    onChange={(e) => setPickup({ contactPhone: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Ghi chú lấy đồ (vd: Tầng 2, đồ đóng thùng...)"
                  value={pickup.note || ''}
                  onChange={(e) => setPickup({ note: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                Điểm giao hàng (Dropoff)
              </h2>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Địa chỉ giao hàng chi tiết"
                  value={dropoff.address}
                  onChange={(e) => setDropoff({ address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên người nhận"
                    value={dropoff.contactName}
                    onChange={(e) => setDropoff({ contactName: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="SĐT người nhận"
                    value={dropoff.contactPhone}
                    onChange={(e) => setDropoff({ contactPhone: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Ghi chú giao (vd: Tòa S2, có thang máy...)"
                  value={dropoff.note || ''}
                  onChange={(e) => setDropoff({ note: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Estimated Route preview */}
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between text-xs text-brand-900">
              <span className="font-medium">Ước lượng quãng đường:</span>
              <span className="font-bold text-brand-600">{formatDistance(fare.distanceKm)} (khoảng 35 phút)</span>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Vehicle */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Chọn loại phương tiện</h2>
              <span className="text-[11px] text-slate-500">Cước tính theo km</span>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_VEHICLES.map((v) => {
                const isSelected = selectedVehicle.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setVehicle(v)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            {v.name}
                            {v.isAiRecommended && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Gợi ý AI
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{v.tag}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-brand-600">
                          {formatCurrency(v.baseFare + Math.round(fare.distanceKm * v.perKmRate))}
                        </div>
                        <div className="text-[10px] text-slate-400">Giá ước tính</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div>Tải trọng: <span className="font-medium text-slate-700">{v.capacityText}</span></div>
                      <div>Kích thước: <span className="font-medium text-slate-700">{v.dimensions}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Cargo & AI Vision Analysis */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-800">Khai báo hàng hóa</h2>
                <span className="text-[11px] text-brand-600 font-medium">Bảo hiểm miễn phí</span>
              </div>
              <textarea
                rows={3}
                placeholder="Mô tả hàng hóa cần chuyển (vd: 1 tủ lạnh mini, đệm 1m6, 4 thùng đồ cá nhân...)"
                value={cargo.name}
                onChange={(e) => setCargo({ name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              ></textarea>
            </div>

            {/* AI Image Analysis Tool */}
            <div className="p-3.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-brand-800">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Mô-đun AI: Phân tích ảnh hàng hóa tự động
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                Chụp hoặc tải ảnh đồ đạc. AI sẽ tự động phân tích thể tích, trọng lượng và đề xuất loại xe chở an toàn nhất.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAiAnalyzing}
                  onClick={() =>
                    triggerAiAnalysis('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80')
                  }
                  className="flex-1 py-2 px-3 bg-white hover:bg-orange-50 border border-brand-300 rounded-xl text-xs font-semibold text-brand-600 flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isAiAnalyzing ? 'Đang phân tích ảnh AI...' : 'Tải ảnh đồ đạc mẫu'}
                </button>
              </div>

              {cargo.aiNotes && (
                <div className="mt-3 p-2.5 bg-white rounded-xl border border-brand-200 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Kết quả thẩm định AI
                  </div>
                  <div className="text-[11px] text-slate-600">{cargo.aiNotes}</div>
                </div>
              )}
            </div>

            {/* Additional Services */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Dịch vụ kèm theo (Tùy chọn)
              </h3>
              <div className="space-y-2">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                      srv.isSelected
                        ? 'border-brand-500 bg-brand-50/40 text-slate-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          srv.isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300'
                        }`}
                      >
                        {srv.isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div>{srv.name}</div>
                        <div className="text-[10px] text-slate-400">{srv.description}</div>
                      </div>
                    </div>
                    <div className="font-bold text-brand-600 text-[11px]">+{formatCurrency(srv.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Payment Selection */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Xác nhận đơn & Thanh toán</h2>

            {/* Summary card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Phương tiện:</span>
                <span className="font-bold text-slate-800">{selectedVehicle.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quãng đường:</span>
                <span className="font-medium text-slate-800">{formatDistance(fare.distanceKm)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cước cơ bản + km:</span>
                <span className="font-medium text-slate-800">{formatCurrency(fare.baseFee + fare.distanceFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dịch vụ bốc xếp:</span>
                <span className="font-medium text-slate-800">+{formatCurrency(fare.servicesFee)}</span>
              </div>
              {fare.discountFee > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Khuyến mãi (MODMOVE2026):</span>
                  <span>-{formatCurrency(fare.discountFee)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Tổng cộng:</span>
                <span className="font-extrabold text-brand-600 text-base">{formatCurrency(fare.totalFee)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Mã giảm giá (Coupon):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập MODMOVE2026"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 uppercase"
                />
                <Button variant="outline" size="sm" onClick={() => setPromoCode(promoCode)}>
                  Áp dụng
                </Button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phương thức thanh toán:</label>
              <div className="space-y-2">
                {[
                  { id: 'PayOS', label: 'Cổng PayOS (Quét mã VietQR chuyển khoản tức thì)', icon: QrCode },
                  { id: 'Cash', label: 'Tiền mặt (Thanh toán trực tiếp cho tài xế)', icon: Banknote },
                  { id: 'Wallet', label: 'Ví ModMove Pay (Số dư: 1.250.000 đ)', icon: Wallet },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => setPaymentMethod(item.id as any)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      paymentMethod === item.id
                        ? 'border-brand-500 bg-brand-50/40 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === item.id}
                      onChange={() => {}}
                      className="accent-brand-500"
                    />
                    <item.icon className="w-4 h-4 text-brand-500" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="outline" size="md" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
        ) : (
          <div className="text-xs text-slate-400">Ahamove & ModMove Style</div>
        )}

        {step < 4 ? (
          <Button variant="primary" size="md" onClick={() => setStep(step + 1)} className="flex-1">
            Tiếp tục <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            onClick={handleCreateOrder}
            className="flex-1 bg-brand-500 hover:bg-brand-600"
          >
            ĐẶT CHUYẾN XE ({formatCurrency(fare.totalFee)})
          </Button>
        )}
      </div>
    </div>
  );
};
