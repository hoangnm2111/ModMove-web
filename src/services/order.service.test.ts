import { beforeEach, describe, expect, it, vi } from 'vitest';
import { filledDraft, van } from '../test/fixtures';
import { User } from '../types/user.types';

const http = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('./api', async (importOriginal) => ({ ...(await importOriginal<typeof import('./api')>()), apiClient: http }));
vi.mock('./catalog.service', () => ({ catalogService: { getVehicleTypesSync: () => [van] } }));

import { orderService } from './order.service';

const customer = { id: '3', fullName: 'An', phoneNumber: '0900000001' } as User;

const quote = (totalFee: number, extra: Record<string, unknown> = {}) => ({
  data: { distanceKm: 10.4, durationMinutes: 21, distanceFee: totalFee, serviceFee: 0, discountAmount: 0, totalFee, ...extra },
});

const detail = (over: Record<string, unknown> = {}) => ({
  data: {
    id: 9,
    orderCode: 'MM9',
    orderStatus: 'Pending',
    pickupAddress: '12 Nguyễn Huệ, Hoàn Kiếm',
    dropoffAddress: '45 Cầu Giấy, Hà Nội',
    vehicleTypeName: 'Xe van 500kg',
    receiverName: 'Anh Nam',
    receiverPhone: '0912345678',
    estimatedDistanceKm: 10.4,
    estimatedDurationMin: 21,
    hasLoadingService: false,
    distanceFee: 154_000,
    serviceFee: 0,
    discountAmount: 0,
    totalFee: 154_000,
    paymentMethod: 'Cash',
    payerRole: 'Sender',
    paymentStatus: 'Unpaid',
    createdAt: '2026-11-24T08:00:00Z',
    cargo: { cargoType: 'GOODS', quantity: 1, weightKg: 20, lengthCm: 40, widthCm: 30, heightCm: 30, photoUrls: [], specialNotes: 'Tủ lạnh • Dễ vỡ' },
    driver: null,
    proof: null,
    history: [],
    payment: null,
    ...over,
  },
});

describe('báo giá (estimate)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('chưa chọn xe hoặc thiếu địa chỉ thì không gọi BE', async () => {
    expect(await orderService.estimate(filledDraft({ vehicleTypeId: null }))).toBeNull();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('trả giá, toạ độ hai điểm và đường đi để vẽ bản đồ', async () => {
    http.post.mockResolvedValueOnce(quote(154_000, { pickup: { latitude: 21.03, longitude: 105.85 }, dropoff: { latitude: 21.04, longitude: 105.8 }, polyline: '_p~iF~ps|U' }));

    const r = (await orderService.estimate(filledDraft()))!;

    expect(r.fare.total).toBe(154_000);
    expect(r.route).toEqual({ from: { lat: 21.03, lng: 105.85 }, to: { lat: 21.04, lng: 105.8 }, polyline: '_p~iF~ps|U' });
    expect(http.post.mock.calls[0][1]).toMatchObject({ vehicleTypeId: 1, weightKg: 20, lengthCm: 40, widthCm: 30, heightCm: 30, couponCode: null });
  });

  it('BE chưa trả toạ độ hoặc đường đi (BE cũ) thì bản đồ vẫn dùng được', async () => {
    http.post.mockResolvedValueOnce(quote(154_000));
    const r = (await orderService.estimate(filledDraft()))!;
    expect(r.route).toEqual({ from: null, to: null, polyline: null });
  });

  it('mã giảm giá không dùng được: vẫn báo giá không mã, kèm lỗi mã để chặn nút đặt', async () => {
    http.post
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 422, data: { code: 'COUPON_MIN_ORDER_NOT_MET', detail: 'Đơn chưa đạt giá trị tối thiểu để dùng mã này.' } } })
      .mockResolvedValueOnce(quote(154_000));

    const r = (await orderService.estimate(filledDraft({ couponCode: 'MODMOVE100K' })))!;

    expect(r.couponError).toBeTruthy();
    expect(r.fare.total).toBe(154_000);
    expect(http.post.mock.calls.map((c) => c[1].couponCode)).toEqual(['MODMOVE100K', null]);
  });
});

describe('gửi đơn (createOrder)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  const placeOrder = () => {
    http.post.mockResolvedValueOnce(quote(154_000)); // báo giá lại ngay trước khi gửi
    http.post.mockResolvedValueOnce({ data: { orderId: 9, orderCode: 'MM9', totalFee: 154_000 } });
    http.get.mockResolvedValueOnce(detail({ senderName: 'Chị Hoa', senderPhone: '0987654321', pickupNote: 'Cửa hầm B1', dropoffNote: 'Gọi trước 15 phút' }));
  };

  it('gửi người gửi, ghi chú hai điểm, ghi chú hàng đã gộp, số điện thoại dạng 0… và tổng tiền vừa báo giá', async () => {
    placeOrder();
    const draft = filledDraft();
    draft.dropoff.note = 'Gọi trước 15 phút';

    const order = await orderService.createOrder(draft, customer, 154_000);

    const body = http.post.mock.calls[1][1];
    expect(http.post.mock.calls[1][0]).toBe('/customer/Orders');
    expect(body).toMatchObject({
      senderName: 'Chị Hoa',
      senderPhone: '0987654321',
      receiverName: 'Anh Nam',
      receiverPhone: '0912345678',
      pickupNote: 'Cửa hầm B1',
      dropoffNote: 'Gọi trước 15 phút',
      paymentMethod: 'Cash',
      payerRole: 'Sender',
      prohibitedGoodsCommitment: true,
      expectedTotalFee: 154_000,
    });
    expect(body.cargo.specialNotes).toBe('Tủ lạnh • Dễ vỡ');
    expect(order.code).toBe('MM9');
  });

  it('ghi chú trống gửi null; chuyển khoản không gửi người trả tiền', async () => {
    placeOrder();
    const draft = filledDraft({ paymentMethod: 'PayOS' });
    draft.pickup.note = '  ';

    await orderService.createOrder(draft, customer, 154_000);

    const body = http.post.mock.calls[1][1];
    expect(body.pickupNote).toBeNull();
    expect(body.dropoffNote).toBeNull();
    expect(body.payerRole).toBeNull();
  });

  it('giá đổi ngay trước khi gửi: không tạo đơn, báo giá mới', async () => {
    http.post.mockResolvedValueOnce(quote(160_000));

    await expect(orderService.createOrder(filledDraft(), customer, 154_000)).rejects.toMatchObject({ code: 'FARE_CHANGED' });

    expect(http.post).toHaveBeenCalledTimes(1); // chỉ báo giá, không POST đơn
  });

  it('mã giảm giá lỗi thì không gửi đơn', async () => {
    http.post
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 422, data: { code: 'COUPON_EXPIRED', detail: 'Mã đã hết hạn.' } } })
      .mockResolvedValueOnce(quote(154_000));

    await expect(orderService.createOrder(filledDraft({ couponCode: 'OLD' }), customer, 154_000)).rejects.toMatchObject({ code: 'COUPON_INVALID' });
    expect(http.post.mock.calls.some((c) => c[0] === '/customer/Orders')).toBe(false);
  });

  it('BE từ chối vì giá đổi (FARE_CHANGED) thì báo lỗi bằng tiếng Việt, kèm giá mới', async () => {
    http.post.mockResolvedValueOnce(quote(154_000)).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, data: { code: 'FARE_CHANGED', detail: 'Giá mới 160000' } },
    });

    const error = await orderService.createOrder(filledDraft(), customer, 154_000).catch((e) => e);

    expect(error.code).toBe('FARE_CHANGED');
    expect(error.message).toContain('Giá cước vừa thay đổi');
    expect(error.message).toContain('160000');
  });

  it('chi tiết đơn có người gửi và ghi chú; đơn cũ chưa có người gửi thì dùng khách đặt', async () => {
    http.get.mockResolvedValueOnce(detail({ senderName: 'Chị Hoa', senderPhone: '0987654321', pickupNote: 'Cửa hầm B1', dropoffNote: null }));
    const withSender = await orderService.loadOrderDetail('9');
    expect(withSender.pickup).toMatchObject({ contactName: 'Chị Hoa', contactPhone: '0987654321', note: 'Cửa hầm B1' });
    expect(withSender.dropoff.note).toBeUndefined();

    http.get.mockResolvedValueOnce(detail({ senderName: null, senderPhone: null }));
    const legacy = await orderService.loadOrderDetail('9');
    expect(legacy.pickup.contactName).toBe(legacy.customerName);
    expect(legacy.pickup.note).toBeUndefined();
  });
});
