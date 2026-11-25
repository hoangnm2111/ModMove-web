import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { publicConfig } from '../test/publicConfig';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('./api', async (importOriginal) => ({ ...(await importOriginal<typeof import('./api')>()), apiClient: http }));

import { BUSINESS } from '../config/business';
import { ERROR_MESSAGES } from '../api/errors';
import { msg } from '../constants/messages';
import { usePublicConfigStore } from './config.service';
import { cargoNotes } from '../domain/booking';
import { password } from '../domain/validators';

const defaults = { ...BUSINESS };

describe('cấu hình công khai từ BE', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    usePublicConfigStore.setState({ config: null });
  });
  afterEach(() => Object.assign(BUSINESS, defaults)); // trả lại số dự phòng cho các test khác

  it('chưa tải được thì config là null: giao diện không có số tiền để hiện', async () => {
    http.get.mockRejectedValueOnce(new Error('offline'));

    await usePublicConfigStore.getState().loadConfig();

    expect(usePublicConfigStore.getState().config).toBeNull();
    expect(BUSINESS.MAX_CARGO_PHOTOS).toBe(5); // vẫn có giới hạn dự phòng để biểu mẫu kiểm tra được
  });

  it('gọi đúng endpoint công khai và lưu số thật của BE', async () => {
    http.get.mockResolvedValueOnce({ data: publicConfig() });

    await usePublicConfigStore.getState().loadConfig();

    expect(http.get).toHaveBeenCalledWith('/public/Config');
    expect(usePublicConfigStore.getState().config?.loadingFee).toBe(250_000);
    expect(usePublicConfigStore.getState().config?.requiredDeposit).toBe(300_000);
  });

  it('ghi đè các giới hạn nghiệp vụ bằng số của BE', async () => {
    http.get.mockResolvedValueOnce({ data: publicConfig() });

    await usePublicConfigStore.getState().loadConfig();

    expect(BUSINESS).toMatchObject({
      MAX_CARGO_PHOTOS: 4,
      MAX_PHOTO_SIZE_MB: 3,
      MAX_NOTE_LENGTH: 300,
      MATCHING_TIMEOUT_MIN: 15,
      UNPAID_ORDER_TIMEOUT_MIN: 45,
      PAYOS_CODE_TTL_MIN: 12,
      COMPLAINT_WINDOW_HOURS: 48,
      RATING_WINDOW_HOURS: 36,
      AUTO_COMPLETE_HOURS: 72,
      PASSWORD_MIN: 10,
      PASSWORD_MAX: 30,
      OTP_TTL_SECONDS: 180,
      MAX_FAILED_SIGNIN: 4,
      SIGNIN_LOCK_MINUTES: 20,
    });
  });

  it('câu báo lỗi và thông điệp đổi theo số thật, không còn số gõ cứng', async () => {
    http.get.mockResolvedValueOnce({ data: publicConfig() });
    expect(ERROR_MESSAGES.COMPLAINT_WINDOW_CLOSED).toContain('24 giờ'); // dự phòng khi chưa có số thật

    await usePublicConfigStore.getState().loadConfig();

    expect(ERROR_MESSAGES.COMPLAINT_WINDOW_CLOSED).toContain('48 giờ');
    expect(ERROR_MESSAGES.RATING_WINDOW_CLOSED).toContain('36 giờ');
    expect(ERROR_MESSAGES.FILE_TOO_LARGE).toContain('3 MB');
    expect(ERROR_MESSAGES.TOO_MANY_PHOTOS).toContain('2 ảnh');
    expect(ERROR_MESSAGES.PICKUP_PHOTO_LIMIT).toContain('3 lần');
    expect(msg('MSG11')).toContain('20 phút');
  });

  it('kiểm tra nhập liệu dùng giới hạn thật của BE', async () => {
    http.get.mockResolvedValueOnce({ data: publicConfig() });
    await usePublicConfigStore.getState().loadConfig();

    expect(password('a'.repeat(9))).not.toBeNull(); // dưới 10 ký tự
    expect(password('a'.repeat(10))).toBeNull();
    expect(password('a'.repeat(31))).not.toBeNull(); // trên 30 ký tự
    expect(cargoNotes({ description: 'x'.repeat(10), specialNotes: '' })).toHaveLength(10);
  });
});

describe('trang giới thiệu và nhãn bốc xếp: tiền chỉ lấy từ BE', () => {
  beforeEach(() => usePublicConfigStore.setState({ config: null }));

  it('PaymentStep hiện đúng phí BE trả về, không hiện khi chưa có', async () => {
    const { PaymentStep } = await import('../features/booking/steps/PaymentStep');
    const { filledDraft } = await import('../test/fixtures');
    const props = { couponError: null, discount: 0, errors: {}, onChange: vi.fn(), onShowWarranty: vi.fn(), onShowProhibited: vi.fn() };

    const { rerender } = render(<PaymentStep draft={filledDraft()} loadingFee={0} {...props} />);
    expect(screen.queryByText(/\+/)).toBeNull();

    rerender(<PaymentStep draft={filledDraft()} loadingFee={250_000} {...props} />);
    expect(screen.getByText(/\+250\.000/)).toBeInTheDocument();
  });

  it('cửa sổ bảng giá cho khách vãng lai hiện phí bốc xếp của BE và ẩn dòng này khi chưa tải được', async () => {
    vi.doMock('../hooks/useDomainData', () => ({
      useVehicleTypes: () => [{ id: '1', name: 'Xe van 500kg', isActive: true, maxLoadKg: 500, baseFare: 50_000, pricePerKm: 10_000, minimumFare: 80_000 }],
      useCargoTypes: () => [],
      usePolicies: () => [],
    }));
    vi.resetModules();
    const { usePublicConfigStore: store } = await import('./config.service');
    const { VehiclePriceModal } = await import('../features/landing/LandingInfoModals');

    const closed = render(<VehiclePriceModal open onClose={() => undefined} />);
    expect(screen.queryByText(/Phí bốc xếp/)).toBeNull();
    closed.unmount();

    store.setState({ config: publicConfig() });
    render(<VehiclePriceModal open onClose={() => undefined} />);
    expect(screen.getByText(/Phí bốc xếp 250\.000/)).toBeInTheDocument();
    vi.doUnmock('../hooks/useDomainData');
  });
});
