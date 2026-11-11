import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NOTICE, type ToastKind } from './catalog';
import { notify, useToastStore } from './store';

/** Mã dùng ở các điểm gọi thao tác (Task 5) và loại spec mục 3 */
const EXPECTED_KIND: Record<string, ToastKind> = {
  ORDER_CREATED: 'success',
  ORDER_CANCELLED: 'warning',
  RECEIPT_CONFIRMED: 'success',
  COMPLAINT_SUBMITTED: 'warning',
  INCIDENT_REPORTED: 'warning',
  INCIDENT_REFUND_REQUESTED: 'warning',
  REFUND_INFO_REPLIED: 'info',
  REFUND_WITHDRAWN: 'info',
  RATING_SUBMITTED: 'success',
  PAYMENT_CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  PAYMENT_FAILED: 'error',
  PAYMENT_EXPIRED: 'warning',
  PAYMENT_CANCELLED: 'info',
  DRIVER_APPLICATION_SUBMITTED: 'success',
  DOCUMENT_UPLOAD_FAILED: 'error',
  LOGGED_OUT: 'info',
  SESSION_EXPIRED: 'warning',
  ACTION_ERROR: 'error',
};

beforeEach(() => useToastStore.getState().clear());
afterEach(() => useToastStore.getState().clear());

describe('catalog codes used by action toasts', () => {
  for (const [type, kind] of Object.entries(EXPECTED_KIND)) {
    it(`${type} exists with kind ${kind}`, () => {
      expect(NOTICE[type], type).toBeDefined();
      expect(NOTICE[type].kind).toBe(kind);
    });
  }

  it('PAYMENT_CONFIRMED text', () => {
    notify('PAYMENT_CONFIRMED', { amount: '120.000 ₫', orderCode: 'MM01' });
    expect(useToastStore.getState().items[0].text).toBe('Đã xác nhận thanh toán 120.000 ₫ cho đơn MM01.');
  });

  it('SESSION_EXPIRED text', () => {
    notify('SESSION_EXPIRED');
    expect(useToastStore.getState().items[0].text).toBe('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  });

  it('ORDER_CREATED text uses the order code', () => {
    notify('ORDER_CREATED', { orderId: '5', orderCode: 'MM05' });
    expect(useToastStore.getState().items[0].text).toBe('Đã gửi yêu cầu MM05. Chúng tôi đang tìm tài xế cho bạn.');
  });

  it('the customer own variants of dual-meaning types are success toasts', () => {
    for (const type of ['COMPLAINT_SUBMITTED', 'INCIDENT_REPORTED', 'INCIDENT_REFUND_REQUESTED', 'REFUND_INFO_REPLIED']) {
      useToastStore.getState().clear();
      notify(type, { orderId: '1' });
      expect(useToastStore.getState().items[0].kind, type).toBe('success');
    }
  });
});
