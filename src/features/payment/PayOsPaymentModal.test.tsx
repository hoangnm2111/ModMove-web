import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

const api = vi.hoisted(() => ({
  createPayment: vi.fn(),
  syncPayment: vi.fn(),
  cancelPayment: vi.fn(),
}));
vi.mock('../../api/endpoints', () => ({ customerApi: api }));
vi.mock('../../components/ui/feedback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../components/ui/feedback')>()),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { PayOsPaymentModal } from './PayOsPaymentModal';
import { toast } from '../../components/ui/feedback';

const session = () => ({ transactionId: 1, checkoutUrl: 'https://pay.payos.vn/x', amount: 111000, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() });

describe('hộp thanh toán PayOS tự kiểm tra', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.createPayment.mockResolvedValue(session());
    api.syncPayment.mockResolvedValue(undefined);
    api.cancelPayment.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  const open = async (onChecked: () => Promise<boolean>) => {
    const onClose = vi.fn();
    const view = render(<PayOsPaymentModal orderId={9} orderCode="MM9" onClose={onClose} onChecked={onChecked} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // tạo phiên thanh toán
    });
    return Object.assign(onClose, { unmount: view.unmount });
  };
  const tick = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

  it('khách chuyển khoản xong: sau vài giây hộp tự báo thành công và đóng, không cần bấm nút', async () => {
    const onChecked = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onClose = await open(onChecked);

    await tick(3000);
    expect(onClose).not.toHaveBeenCalled(); // lần 1: chưa trả
    await tick(3000);

    expect(api.syncPayment).toHaveBeenCalledWith(9); // BE tự hỏi PayOS, không chờ webhook
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('đã đóng hộp thì dừng kiểm tra', async () => {
    const onChecked = vi.fn().mockResolvedValue(false);
    const view = await open(onChecked);
    await tick(3000);
    expect(onChecked).toHaveBeenCalledTimes(1);

    view.unmount();
    await tick(15000);

    expect(onChecked).toHaveBeenCalledTimes(1);
  });

  it('lỗi mạng khi kiểm tra không làm hộp sập, lần sau vẫn thử lại', async () => {
    const onChecked = vi.fn().mockRejectedValueOnce(new Error('mất mạng')).mockResolvedValueOnce(true);
    const onClose = await open(onChecked);

    await tick(3000);
    await tick(3000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
