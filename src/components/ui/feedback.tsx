import React, { useEffect } from 'react';
import { create } from 'zustand';
import { Modal } from './Modal';
import { Button } from '../Button';
import type { ToastKind } from '../../notifications/store';
import { TOAST_STYLE } from './Toast';

/* ------------------------------------------------------------------ Toast */
// Toast chung nằm ở notifications/ (store, danh mục) và Toast.tsx (viewport);
// re-export để các lời gọi `toast.*` / `<ToastViewport />` cũ vẫn chạy.
export { toast } from '../../notifications/store';
export { ToastViewport } from './Toast';

/* ---------------------------------------------------------------- Banner */
export const Banner: React.FC<{ kind?: ToastKind; children: React.ReactNode; className?: string }> = ({ kind = 'info', children, className = '' }) => {
  const { cls, Icon } = TOAST_STYLE[kind];
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
