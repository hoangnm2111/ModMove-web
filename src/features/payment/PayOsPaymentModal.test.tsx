import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { OrderDetailResponse } from '../../api/types';
import { useToastStore } from '../../notifications/store';

vi.mock('../../api/endpoints', () => ({
  customerApi: {
    createPayment: vi.fn(async () => ({
      transactionId: 1,
      checkoutUrl: 'https://pay.example/x',
      qrCode: null,
      amount: 120000,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    })),
  },
}));

import { PayOsPaymentModal } from './PayOsPaymentModal';

const fresh = (paymentStatus: string, transactionStatus?: string) =>
  ({ paymentStatus, totalFee: 120000, payment: transactionStatus ? { transactionStatus } : null }) as unknown as OrderDetailResponse;
const items = () => useToastStore.getState().items;

const setup = async (result: OrderDetailResponse) => {
  const onClose = vi.fn();
  render(<PayOsPaymentModal orderId={7} orderCode="MM01" onClose={onClose} onChecked={async () => result} />);
  const btn = await screen.findByRole('button', { name: /kiểm tra/i });
  await waitFor(() => expect(btn).not.toBeDisabled());
  fireEvent.click(btn);
  await waitFor(() => expect(items().length).toBeGreaterThan(0));
  return onClose;
};

beforeEach(() => useToastStore.getState().clear());
afterEach(() => useToastStore.getState().clear());

describe('PayOsPaymentModal check result → catalog toast', () => {
  it('paid → PAYMENT_CONFIRMED with amount and code, closes the modal', async () => {
    const onClose = await setup(fresh('Paid', 'Paid'));
    expect(items()[0]).toMatchObject({ type: 'PAYMENT_CONFIRMED', kind: 'success' });
    expect(items()[0].text).toContain('MM01');
    expect(items()[0].text).toMatch(/120\.000/);
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ['Expired', 'PAYMENT_EXPIRED'],
    ['Failed', 'PAYMENT_FAILED'],
    ['Cancelled', 'PAYMENT_CANCELLED'],
    ['Pending', 'PAYMENT_PENDING'],
  ])('transaction %s → %s, modal stays open', async (tx, type) => {
    const onClose = await setup(fresh('Unpaid', tx));
    expect(items()[0].type).toBe(type);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('no transaction info → PAYMENT_PENDING', async () => {
    await setup(fresh('Unpaid'));
    expect(items()[0].type).toBe('PAYMENT_PENDING');
  });
});
