/** Bộ khối giao diện dùng chung cho các trang nghiệp vụ (giữ phong cách slate/blue của dự án) */
import React, { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, ImageOff, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { CHANGED_BY, ORDER_STATUS } from '../../api/labels';
import type { OrderStatus } from '../../api/types';
import { formatDateTime } from '../../utils/format';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------ Pill / badge */
export const Pill: React.FC<{ tone: { label: string; cls: string }; className?: string }> = ({ tone, className }) => (
  <span className={cx('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap', tone.cls, className)}>{tone.label}</span>
);
/** GB-31: đơn PayOS chưa thanh toán vẫn ở Pending nhưng CHƯA được gửi tới tài xế → hiển thị "Chờ thanh toán" */
export const AWAITING_PAYMENT = { label: 'Chờ thanh toán', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
export const isAwaitingPayment = (status: string, paymentMethod?: string, paymentStatus?: string) =>
  status === 'Pending' && paymentMethod === 'PayOS' && paymentStatus === 'Unpaid';
export const StatusPill: React.FC<{ status: OrderStatus; paymentMethod?: string; paymentStatus?: string }> = ({ status, paymentMethod, paymentStatus }) => (
  <Pill tone={isAwaitingPayment(status, paymentMethod, paymentStatus) ? AWAITING_PAYMENT : ORDER_STATUS[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }} />
);

/* ------------------------------------------------------------ Page shell */
export const PageShell: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; toolbar?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
  toolbar,
  children,
}) => (
  <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden min-w-0">
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
      <div className="mr-auto min-w-0">
        <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      {actions}
    </header>
    {toolbar && <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2 flex-shrink-0">{toolbar}</div>}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
  </div>
);

export const Card: React.FC<{ title?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode; padded?: boolean }> = ({
  title,
  actions,
  className,
  children,
  padded = true,
}) => (
  <section className={cx('bg-white border border-slate-200 rounded-2xl shadow-xs', className)}>
    {(title || actions) && (
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-black text-slate-900 mr-auto">{title}</h2>
        {actions}
      </div>
    )}
    <div className={padded ? 'p-4 sm:p-5' : ''}>{children}</div>
  </section>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; accent?: string; onClick?: () => void }> = ({
  label,
  value,
  hint,
  icon,
  accent = 'bg-blue-50 text-blue-600',
  onClick,
}) => (
  <div
    onClick={onClick}
    className={cx('bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-start gap-3', onClick && 'cursor-pointer hover:border-slate-400 transition')}
  >
    {icon && <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>{icon}</div>}
    <div className="min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight truncate">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------------ Trạng thái tải */
export const Loading: React.FC<{ text?: string }> = ({ text = 'Đang tải dữ liệu…' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" /> {text}
  </div>
);
export const ErrorBox: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center">
    <AlertTriangle className="w-6 h-6 text-rose-500" />
    <p className="text-sm font-semibold text-rose-700">{error}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs font-bold text-blue-600 flex items-center gap-1">
        <RefreshCw className="w-3.5 h-3.5" /> Thử lại
      </button>
    )}
  </div>
);
export const Empty: React.FC<{ text: string; action?: React.ReactNode }> = ({ text, action }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-500">
    <Inbox className="w-7 h-7 text-slate-300" />
    <p>{text}</p>
    {action}
  </div>
);
/** Gộp loading/error/empty cho một khối dữ liệu */
export function DataState<T>({ q, empty, children }: { q: { data: T | undefined; loading: boolean; error: string | null; reload: () => void }; empty?: (d: T) => boolean; children: (d: T) => React.ReactNode }) {
  if (q.loading && q.data === undefined) return <Loading />;
  if (q.error && q.data === undefined) return <ErrorBox error={q.error} onRetry={q.reload} />;
  if (q.data === undefined) return null;
  if (empty?.(q.data)) return <Empty text="Không có dữ liệu phù hợp." />;
  return <>{children(q.data)}</>;
}

/* ------------------------------------------------------------ Form nhỏ */
export const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string }> = ({ value, onChange, placeholder = 'Tìm kiếm…', className }) => (
  <div className={cx('relative', className)}>
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm w-64 max-w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    />
  </div>
);
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }> = ({ options, className, ...p }) => (
  <select {...p} className={cx('py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20', className)}>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
export const Tabs = <K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: { key: K; label: string; count?: number }[] }) => (
  <div className="flex gap-1 overflow-x-auto" role="tablist">
    {items.map((t) => (
      <button
        key={t.key}
        role="tab"
        aria-selected={value === t.key}
        onClick={() => onChange(t.key)}
        className={cx(
          'px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition',
          value === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
        )}
      >
        {t.label}
        {t.count !== undefined && <span className="ml-1 text-slate-400">({t.count})</span>}
      </button>
    ))}
  </div>
);

export const Pager: React.FC<{ page: number; pageSize: number; total: number; onChange: (p: number) => void }> = ({ page, pageSize, total, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return total > 0 ? <p className="text-[11px] text-slate-400 mt-3">{total} bản ghi</p> : null;
  return (
    <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
      <span>
        {total} bản ghi • Trang {page}/{pages}
      </span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40" aria-label="Trang trước">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40" aria-label="Trang sau">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ Hiển thị chi tiết */
export const KV: React.FC<{ label: React.ReactNode; children: React.ReactNode; strong?: boolean }> = ({ label, children, strong }) => (
  <div className="flex justify-between gap-3 py-1 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className={cx('text-right text-slate-800', strong ? 'font-black' : 'font-semibold')}>{children}</span>
  </div>
);
export const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center gap-2 mb-2">
    <h3 className="text-sm font-extrabold text-slate-900 mr-auto">{children}</h3>
    {right}
  </div>
);

/** Lưới ảnh có xem phóng to */
export const PhotoGrid: React.FC<{ urls: (string | null | undefined)[]; size?: 'sm' | 'md'; emptyText?: string }> = ({ urls, size = 'md', emptyText = 'Chưa có ảnh' }) => {
  const list = urls.filter(Boolean) as string[];
  const [open, setOpen] = useState<string | null>(null);
  if (list.length === 0)
    return (
      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <ImageOff className="w-3.5 h-3.5" /> {emptyText}
      </p>
    );
  const dim = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20';
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {list.map((u, i) => (
          <button key={i} type="button" onClick={() => setOpen(u)} className={cx(dim, 'rounded-xl overflow-hidden border border-slate-200 hover:ring-2 ring-blue-500')}>
            <img src={u} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <img src={open} alt="Ảnh phóng to" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

/** Lịch sử trạng thái đơn (customer: changedAt; staff: createdAt) */
export const StatusTimeline: React.FC<{
  items: { fromStatus?: OrderStatus | null; toStatus: OrderStatus; changedByRole: string; changedByUserName?: string | null; note: string | null; at: string }[];
}> = ({ items }) => {
  if (items.length === 0) return <p className="text-xs text-slate-400">Chưa có lịch sử.</p>;
  return (
    <ol className="relative border-l-2 border-slate-200 ml-1.5 space-y-3">
      {items.map((h, i) => (
        <li key={i} className="pl-4 relative">
          <span className={cx('absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white', i === items.length - 1 ? 'bg-blue-600' : 'bg-slate-300')} />
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={h.toStatus} />
            <span className="text-[11px] text-slate-400">{formatDateTime(h.at)}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Bởi {CHANGED_BY[h.changedByRole] ?? h.changedByRole}
            {h.changedByUserName ? ` – ${h.changedByUserName}` : ''}
          </div>
          {h.note && <div className="text-xs text-slate-700 mt-0.5">“{h.note}”</div>}
        </li>
      ))}
    </ol>
  );
};

/** Drawer bên phải cho chi tiết */
export const Drawer: React.FC<{ open: boolean; onClose: () => void; title: React.ReactNode; width?: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  open,
  onClose,
  title,
  width = 'max-w-2xl',
  children,
  footer,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onMouseDown={onClose}>
      <aside className={cx('w-full h-full bg-white shadow-2xl flex flex-col', width)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="font-black text-slate-900 mr-auto min-w-0 flex items-center gap-2 flex-wrap">{title}</div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap justify-end gap-2 flex-shrink-0">{footer}</div>}
      </aside>
    </div>
  );
};

/** Bảng đơn giản, responsive (cuộn ngang trên màn nhỏ) */
export function Table<R>({ rows, cols, onRow, rowKey }: { rows: R[]; rowKey: (r: R) => React.Key; onRow?: (r: R) => void; cols: { head: string; cell: (r: R) => React.ReactNode; className?: string }[] }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-xs min-w-[720px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            {cols.map((c) => (
              <th key={c.head} className={cx('px-3 py-2 font-bold', c.className)}>
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} onClick={() => onRow?.(r)} className={cx('border-b border-slate-100 last:border-0', onRow && 'cursor-pointer hover:bg-slate-50')}>
              {cols.map((c) => (
                <td key={c.head} className={cx('px-3 py-2.5 align-top', c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ngày yyyy-MM-dd theo giờ địa phương */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
