import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { filledDraft } from '../test/fixtures';

const KEY = 'modmove:v4:bookingDraft';
const HOUR = 60 * 60 * 1000;

/** Nạp lại module để bản nháp được đọc lại từ localStorage như khi mở trang */
async function openPage() {
  vi.resetModules();
  return import('./useBookingDraftStore');
}

const save = (draft: unknown, savedAt: number, step = 3) => localStorage.setItem(KEY, JSON.stringify({ draft, step, savedAt }));

describe('nháp đặt xe', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-24T08:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('ảnh khách chọn khi chưa đăng nhập (data URL) không ghi vào localStorage, ảnh đã tải lên thì có (DEF-009)', async () => {
    const { useBookingDraftStore } = await openPage();
    const local = 'data:image/jpeg;base64,AAAA';
    const uploaded = 'https://res.cloudinary.com/x/image/upload/a.jpg';
    useBookingDraftStore.getState().update(filledDraft());
    useBookingDraftStore.getState().setCargo({ photos: [uploaded, local] });
    expect(useBookingDraftStore.getState().draft.cargo.photos).toEqual([uploaded, local]);
    expect(JSON.parse(localStorage.getItem(KEY)!).draft.cargo.photos).toEqual([uploaded]);
  });

  it('không có nháp thì bắt đầu trống và không hỏi', async () => {
    const { useBookingDraftStore } = await openPage();
    const s = useBookingDraftStore.getState();
    expect(s.restored).toBe(false);
    expect(s.draft.pickup.address).toBe('');
    expect(s.step).toBe(1);
  });

  it('nháp còn hạn: mở lại, hỏi tiếp tục hay bắt đầu lại, giữ bước đang dở', async () => {
    save(filledDraft(), Date.now() - 23 * HOUR);
    const { useBookingDraftStore } = await openPage();
    const s = useBookingDraftStore.getState();
    expect(s.restored).toBe(true);
    expect(s.step).toBe(3);
    expect(s.draft.pickup.contactName).toBe('Chị Hoa');
    expect(s.draft.pickup.note).toBe('Cửa hầm B1');
    expect(s.draft.cargo.photos).toHaveLength(1);
  });

  it('mở lại không khôi phục mã giảm giá và các ô đồng ý chính sách', async () => {
    save(filledDraft({ couponCode: 'WELCOME20K' }), Date.now() - HOUR);
    const { useBookingDraftStore } = await openPage();
    const d = useBookingDraftStore.getState().draft;
    expect(d.couponCode).toBe('');
    expect(d.agreedNoProhibitedCargo).toBe(false);
    expect(d.agreedWarrantyPolicy).toBe(false);
  });

  it('quá 24 giờ thì bỏ nháp và xoá khỏi trình duyệt', async () => {
    save(filledDraft(), Date.now() - 25 * HOUR);
    const { useBookingDraftStore } = await openPage();
    expect(useBookingDraftStore.getState().restored).toBe(false);
    expect(useBookingDraftStore.getState().draft.pickup.address).toBe('');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('nháp cũ không có dấu thời gian thì bỏ', async () => {
    localStorage.setItem(KEY, JSON.stringify({ draft: filledDraft(), step: 2 }));
    const { useBookingDraftStore } = await openPage();
    expect(useBookingDraftStore.getState().restored).toBe(false);
  });

  it('nháp hỏng thì bỏ qua, không làm hỏng trang', async () => {
    localStorage.setItem(KEY, '{không phải json');
    const { useBookingDraftStore } = await openPage();
    expect(useBookingDraftStore.getState().restored).toBe(false);
  });

  it('nháp trống thì không giữ lại', async () => {
    const { createEmptyDraft } = await openPage();
    save(createEmptyDraft(), Date.now());
    const { useBookingDraftStore } = await openPage();
    expect(useBookingDraftStore.getState().restored).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('khách nhập thì lưu kèm thời điểm; chọn Tiếp tục thì tắt câu hỏi nhưng giữ nội dung', async () => {
    const { useBookingDraftStore } = await openPage();
    useBookingDraftStore.getState().setPickup({ address: '12 Nguyễn Huệ' });
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.draft.pickup.address).toBe('12 Nguyễn Huệ');
    expect(saved.savedAt).toBe(Date.now());

    save(filledDraft(), Date.now());
    const again = (await openPage()).useBookingDraftStore;
    again.getState().keepRestored();
    expect(again.getState().restored).toBe(false);
    expect(again.getState().draft.dropoff.contactName).toBe('Anh Nam');
  });

  it('Bắt đầu lại: xoá nháp trong máy', async () => {
    save(filledDraft(), Date.now());
    const { useBookingDraftStore } = await openPage();
    useBookingDraftStore.getState().reset();
    expect(useBookingDraftStore.getState().draft.pickup.address).toBe('');
    expect(useBookingDraftStore.getState().restored).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('đăng xuất: xoá nháp của phiên trước', async () => {
    const { useBookingDraftStore, clearBookingDraft } = await openPage();
    useBookingDraftStore.getState().setPickup({ address: '12 Nguyễn Huệ' });
    expect(localStorage.getItem(KEY)).not.toBeNull();
    clearBookingDraft();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(useBookingDraftStore.getState().draft.pickup.address).toBe('');
  });
});
