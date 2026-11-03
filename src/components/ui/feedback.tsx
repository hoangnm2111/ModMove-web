import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../Button';

/* ------------------------------------------------------------------ Toast */
type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}
interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, text: string) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (kind, text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, kind, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Gọi từ bất kỳ đâu: toast.success('...') */
export const toast = {
  success: (t: string) => useToastStore.getState().push('success', t),
  error: (t: string) => useToastStore.getState().push('error', t),
  info: (t: string) => useToastStore.getState().push('info', t),
  warning: (t: string) => useToastStore.getState().push('warning', t),
};

const STYLE: Record<ToastKind, { cls: string; Icon: React.FC<{ className?: string }> }> = {
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: XCircle },
  info: { cls: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
};

export const ToastViewport: React.FC = () => {
  const { items, dismiss } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(92vw,380px)]" aria-live="polite">
      {items.map((t) => {
        const { cls, Icon } = STYLE[t.kind];
        return (
          <button key={t.id} type="button" onClick={() => dismiss(t.id)} className={`flex items-start gap-2 text-left px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${cls}`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{t.text}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- Banner */
export const Banner: React.FC<{ kind?: ToastKind; children: React.ReactNode; className?: string }> = ({ kind = 'info', children, className = '' }) => {
  const { cls, Icon } = STYLE[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${cls} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

/* --------------------------------------------------------------- Confirm */
interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  danger?: boolean;
}
interface ConfirmState {
  opts: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
  open: (o: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  opts: null,
  resolve: null,
  open: (opts) => new Promise<boolean>((resolve) => set({ opts, resolve })),
  close: (ok) => {
    get().resolve?.(ok);
    set({ opts: null, resolve: null });
  },
}));

/** Hộp xác nhận chuẩn (MSG36, MSG52, MSG62, MSG68…): `if (await confirm({...})) …` */
export const confirm = (o: ConfirmOptions) => useConfirmStore.getState().open(o);

export const ConfirmHost: React.FC = () => {
  const { opts, close } = useConfirmStore();
  useEffect(() => () => close(false), [close]);
  return (
    <Modal
      open={Boolean(opts)}
      title={opts?.title}
      onClose={() => close(false)}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => close(false)}>
            Huỷ
          </Button>
          <Button variant={opts?.danger ? 'danger' : 'primary'} size="sm" onClick={() => close(true)}>
            {opts?.confirmText ?? 'Xác nhận'}
          </Button>
        </>
      }
    >
      {opts?.message}
    </Modal>
  );
};
