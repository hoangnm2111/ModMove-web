import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTICE } from './catalog';
import { notify, notifyError, toast, useToastStore } from './store';

const items = () => useToastStore.getState().items;
const last = () => items()[0];

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.getState().clear();
});
afterEach(() => {
  useToastStore.getState().clear();
  vi.useRealTimers();
});

describe('notify', () => {
  it('uses catalog fallback with params', () => {
    notify('PICKUP_PHOTOS_TO_REVIEW', { orderId: '7', orderCode: 'MM01' });
    const t = last();
    expect(t.kind).toBe('warning');
    expect(t.text).toBe('Ảnh kiểm hàng của đơn MM01 đã sẵn sàng. Vui lòng duyệt trước khi xe khởi hành.');
    expect(t.duration).toBe(6000);
  });

  it('server text wins', () => {
    notify('ORDER_ACCEPTED', { orderId: '7' }, { title: 'Đơn đã có tài xế', body: 'X' });
    expect(last()).toMatchObject({ title: 'Đơn đã có tài xế', text: 'X', kind: 'info' });
  });

  it('unknown type → info with server text', () => {
    notify('NEW_THING', {}, { body: 'B' });
    expect(last()).toMatchObject({ kind: 'info', text: 'B', href: undefined });
  });

  it('unknown type with only a title shows it as the text', () => {
    notify('NEW_THING', {}, { title: 'T' });
    expect(last()).toMatchObject({ kind: 'info', text: 'T', title: undefined });
  });

  it('ignores a notice with nothing to show', () => {
    notify('NEW_THING');
    expect(items()).toHaveLength(0);
  });

  it('dedupes same type+orderId within 10s', () => {
    notify('ORDER_CANCELLED', { orderId: '7' });
    // Toast warning tự tắt sau 6 s; tạm dừng để đếm số lần hiện đúng trong cửa sổ 10 s
    useToastStore.getState().pause(last().id);
    vi.advanceTimersByTime(9000);
    notify('ORDER_CANCELLED', { orderId: '7' });
    expect(items()).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    notify('ORDER_CANCELLED', { orderId: '7' });
    expect(items()).toHaveLength(2);
  });

  it('own action + server echo of the same cancel shows once', () => {
    notify('ORDER_CANCELLED', { orderId: '7', orderCode: 'MM01' });
    notify('ORDER_CANCELLED', { orderId: '7' }, { title: 'Đơn đã huỷ', body: 'Đơn MM01 đã được huỷ.' });
    expect(items()).toHaveLength(1);
  });

  it('does not dedupe different orders or notices without orderId', () => {
    notify('ORDER_CANCELLED', { orderId: '7' });
    notify('ORDER_CANCELLED', { orderId: '8' });
    toast.success('a');
    toast.success('b');
    expect(items()).toHaveLength(4);
  });

  it('own variant of a dual-meaning type is success, server variant is a warning', () => {
    notify('COMPLAINT_SUBMITTED', { orderId: '7' });
    expect(last()).toMatchObject({ kind: 'success', text: 'Đã gửi khiếu nại. Điều phối viên sẽ xem xét.' });
    notify('COMPLAINT_SUBMITTED', { orderId: '8', orderCode: 'MM02' }, { body: 'Khiếu nại mới cho đơn MM02.' });
    expect(last()).toMatchObject({ kind: 'warning' });
  });
});

describe('store', () => {
  it('keeps at most 4, newest first', () => {
    for (let i = 0; i < 6; i++) toast.info(`t${i}`);
    expect(items().map((t) => t.text)).toEqual(['t5', 't4', 't3', 't2']);
  });

  it('auto-dismisses by kind', () => {
    toast.error('e');
    vi.advanceTimersByTime(6999);
    expect(items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(items()).toHaveLength(0);

    toast.success('s');
    vi.advanceTimersByTime(3999);
    expect(items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(items()).toHaveLength(0);
  });

  it('paused toast stays; resume dismisses after the remaining time', () => {
    toast.error('e');
    const id = last().id;
    vi.advanceTimersByTime(3000);
    useToastStore.getState().pause(id);
    vi.advanceTimersByTime(10_000);
    expect(items()).toHaveLength(1);
    useToastStore.getState().resume(id);
    vi.advanceTimersByTime(3999);
    expect(items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(items()).toHaveLength(0);
  });

  it('dismiss removes the toast and cancels its timer', () => {
    toast.info('x');
    useToastStore.getState().dismiss(last().id);
    expect(items()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('legacy API', () => {
  it('toast.error keeps 1-line text', () => {
    toast.error('Chọn loại xe.');
    expect(last()).toMatchObject({ kind: 'error', text: 'Chọn loại xe.', title: undefined, type: 'ACTION_ERROR' });
  });

  it('toast.success uses ACTION_DONE', () => {
    toast.success('Xong rồi');
    expect(last()).toMatchObject({ kind: 'success', text: 'Xong rồi', type: 'ACTION_DONE' });
  });

  it('notifyError shows the error message', () => {
    notifyError(new Error('Hết hàng'));
    expect(last()).toMatchObject({ kind: 'error', text: 'Hết hàng', type: 'ACTION_ERROR' });
  });

  it('notifyError falls back to the catalog text for non-errors', () => {
    notifyError('boom');
    expect(last().kind).toBe('error');
    expect(last().text).not.toBe('');
  });
});

describe('catalog', () => {
  it('every catalog entry renders non-empty text with empty data', () => {
    for (const k of Object.keys(NOTICE)) {
      expect(NOTICE[k].text({}), k).not.toBe('');
      if (NOTICE[k].own) expect(NOTICE[k].own!.text({}), `${k} own`).not.toBe('');
    }
  });
});
