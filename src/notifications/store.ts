import { create } from 'zustand';
import { errorMessage } from '../services/mock/storage';
import { useAuthStore } from '../store/useAuthStore';
import { NOTICE, type NoticeData, type ToastKind } from './catalog';

export type { NoticeData, ToastKind } from './catalog';

export interface ToastItem {
  id: number;
  type: string;
  kind: ToastKind;
  title?: string;
  text: string;
  href?: string;
  duration: number;
}

const MAX_TOASTS = 4;
const DEDUPE_MS = 10_000;
const DURATION: Record<ToastKind, number> = { success: 4000, info: 4000, warning: 6000, error: 7000 };

interface ToastState {
  items: ToastItem[];
  push: (item: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => void;
  dismiss: (id: number) => void;
  /** Hover: dừng đếm, giữ lại phần thời gian còn lại */
  pause: (id: number) => void;
  resume: (id: number) => void;
  /** Xoá toast (đăng xuất / đổi tài khoản); `keepTypes` giữ lại các toast báo chính việc đăng xuất */
  clear: (keepTypes?: string[]) => void;
}

interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
}
const timers = new Map<number, Timer>();
let nextId = 1;

const dropTimer = (id: number) => {
  const t = timers.get(id);
  if (t?.handle) clearTimeout(t.handle);
  timers.delete(id);
};

export const useToastStore = create<ToastState>((set, get) => {
  const startTimer = (id: number, remaining: number) => {
    const t: Timer = { handle: null, remaining, startedAt: Date.now() };
    t.handle = setTimeout(() => get().dismiss(id), remaining);
    timers.set(id, t);
  };

  return {
    items: [],
    push: (input) => {
      const id = nextId++;
      const duration = input.duration ?? DURATION[input.kind];
      const next = [{ ...input, id, duration }, ...get().items];
      next.slice(MAX_TOASTS).forEach((t) => dropTimer(t.id));
      set({ items: next.slice(0, MAX_TOASTS) });
      startTimer(id, duration);
    },
    dismiss: (id) => {
      dropTimer(id);
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    },
    pause: (id) => {
      const t = timers.get(id);
      if (!t?.handle) return;
      clearTimeout(t.handle);
      t.handle = null;
      t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
    },
    resume: (id) => {
      const t = timers.get(id);
      if (!t || t.handle) return;
      startTimer(id, t.remaining);
    },
    clear: (keepTypes = []) => {
      const kept = get().items.filter((t) => keepTypes.includes(t.type));
      get().items.forEach((t) => {
        if (!kept.includes(t)) dropTimer(t.id);
      });
      recent.clear();
      set({ items: kept });
    },
  };
});

/** Chống trùng: cùng `type` + `orderId` trong 10 giây chỉ hiện một lần (thao tác của mình + server dội lại) */
const recent = new Map<string, number>();
const isDuplicate = (type: string, orderId?: string): boolean => {
  if (!orderId) return false;
  const now = Date.now();
  for (const [k, at] of recent) if (now - at >= DEDUPE_MS) recent.delete(k);
  const key = `${type}:${orderId}`;
  if (recent.has(key)) return true;
  recent.set(key, now);
  return false;
};

/**
 * Hiện một thông báo theo mã danh mục. `server` có thì chữ của server được dùng nguyên văn;
 * thiếu thì dùng chữ dự phòng trong danh mục. Mã lạ: dạng thông tin, chỉ hiện chữ của server.
 */
export function notify(type: string, data: NoticeData = {}, server?: { title?: string; body?: string }): void {
  const def = NOTICE[type];
  const variant = def && !server && def.own ? def.own : def;
  const kind: ToastKind = variant?.kind ?? 'info';

  let title: string | undefined = server ? server.title || undefined : def?.title || undefined;
  let text = server?.body || (server ? '' : variant?.text(data) ?? '');
  if (!text && server) {
    // Server không gửi nội dung: tiêu đề của server làm nội dung, hoặc dùng chữ dự phòng khi mã đã biết
    if (server.title) {
      text = server.title;
      title = undefined;
    } else if (variant) {
      text = variant.text(data);
    }
  }
  if (!text) return;

  if (isDuplicate(type, data.orderId)) return;

  const role = useAuthStore.getState().user?.role;
  const href = def?.href && role ? def.href(data, role) : undefined;
  useToastStore.getState().push({ type, kind, title, text, href });
}

/** Lỗi thao tác (catch của API): hiện câu đã dịch của `errorMessage` */
export function notifyError(e: unknown): void {
  notify('ACTION_ERROR', {}, e instanceof Error ? { body: errorMessage(e) } : undefined);
}

const legacy = (type: string, text: string) => notify(type, {}, { body: text });

/** API cũ: `toast.success('...')` — một dòng chữ, không tiêu đề, không chống trùng */
export const toast = {
  success: (t: string) => legacy('ACTION_DONE', t),
  error: (t: string) => legacy('ACTION_ERROR', t),
  info: (t: string) => legacy('ACTION_INFO', t),
  warning: (t: string) => legacy('ACTION_WARNING', t),
};
