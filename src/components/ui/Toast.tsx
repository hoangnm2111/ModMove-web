import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastItem, type ToastKind } from '../../notifications/store';

export const TOAST_STYLE: Record<ToastKind, { cls: string; Icon: React.FC<{ className?: string }> }> = {
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: XCircle },
  info: { cls: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
};

const BAR: Record<ToastKind, string> = {
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
  info: 'bg-sky-400',
  warning: 'bg-amber-400',
};

const ToastCard: React.FC<{ t: ToastItem }> = ({ t }) => {
  const dismiss = useToastStore((s) => s.dismiss);
  const pause = useToastStore((s) => s.pause);
  const resume = useToastStore((s) => s.resume);
  const { cls, Icon } = TOAST_STYLE[t.kind];
  return (
    <div
      data-toast={t.type}
      role={t.kind === 'error' ? 'alert' : undefined}
      onMouseEnter={() => pause(t.id)}
      onMouseLeave={() => resume(t.id)}
      className={`group relative overflow-hidden flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm ${cls}`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {t.title && <p className="font-bold leading-snug">{t.title}</p>}
        <p className="font-medium leading-snug break-words">{t.text}</p>
        {t.href && (
          <Link to={t.href} onClick={() => dismiss(t.id)} className="inline-block mt-1.5 text-xs font-bold underline underline-offset-2">
            Xem
          </Link>
        )}
      </div>
      <button type="button" aria-label="Đóng" onClick={() => dismiss(t.id)} className="flex-shrink-0 -mr-1 -mt-0.5 p-1 rounded-md opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
      <span
        aria-hidden
        className={`absolute left-0 bottom-0 h-0.5 w-full origin-left group-hover:[animation-play-state:paused] ${BAR[t.kind]}`}
        style={{ animation: `toast-progress ${t.duration}ms linear forwards` }}
      />
    </div>
  );
};

/** Viewport toast duy nhất của ứng dụng; phải nằm trong BrowserRouter (nút "Xem" là <Link>) */
export const ToastViewport: React.FC = () => {
  const items = useToastStore((s) => s.items);
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(92vw,380px)]" aria-live="polite">
      {items.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
};
