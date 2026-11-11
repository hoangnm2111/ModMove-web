/**
 * Cầu nối giữa sự kiện SignalR `NotificationReceived` và giao diện:
 * `handleServerNotice` kiểm payload rồi hiện toast theo danh mục và phát lên `noticeBus`
 * để các trang đang mở tự tải lại (xem `useNoticeRefresh`). Kết nối hub nằm ở `services/realtime.service.ts`.
 */
import type { NoticeData } from './catalog';
import { notify } from './store';

/** Hub nằm cùng máy chủ với API: bỏ hậu tố `/api` rồi nối `/hubs/tracking` */
export const hubUrl = (apiBase: string): string => `${apiBase.replace(/\/api\/?$/, '')}/hubs/tracking`;

type NoticeListener = (type: string, data: NoticeData) => void;
const listeners = new Set<NoticeListener>();

export const noticeBus = {
  on(fn: NoticeListener): () => void {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  emit(type: string, data: NoticeData): void {
    for (const fn of [...listeners]) {
      try {
        fn(type, data);
      } catch (e) {
        console.warn('Lỗi khi xử lý thông báo', type, e);
      }
    }
  },
};

/** `data` của server có thể chứa số (orderId: 7); chuẩn hoá về chuỗi, bỏ giá trị không phải số/chuỗi/boolean */
const toNoticeData = (raw: unknown): NoticeData => {
  const out: NoticeData = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = String(v);
    }
  }
  return out;
};

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

/** Xử lý một thông báo từ server; payload sai dạng (không có `type` chuỗi) bị bỏ qua */
export function handleServerNotice(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const p = payload as Record<string, unknown>;
  if (typeof p.type !== 'string' || !p.type) return;
  const data = toNoticeData(p.data);
  notify(p.type, data, { title: str(p.title), body: str(p.body) });
  noticeBus.emit(p.type, data);
}
