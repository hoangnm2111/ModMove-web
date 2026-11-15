import React from 'react';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

/** Khối menu bên dùng chung (Admin, Dispatcher) – cùng phong cách sáng với Customer/Driver */
export interface NavItem {
  path: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  badge?: number;
  badgeCls?: string;
}
export interface NavSection {
  title: string;
  items: NavItem[];
}

export const SidebarNav: React.FC<{
  sections: NavSection[];
  isActive: (p: string) => boolean;
  go: (p: string) => void;
}> = ({ sections, isActive, go }) => (
  <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-sm">
    {sections.map((s) => (
      <div key={s.title}>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">{s.title}</div>
        <div className="space-y-2">
          {s.items.map(({ path, label, Icon, badge, badgeCls }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => go(path)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                  active
                    ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-sm'
                    : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                {!!badge && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border ${badgeCls ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>{badge}</span>}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

export const IconRail: React.FC<{ items: NavItem[]; isActive: (p: string) => boolean; go: (p: string) => void; onOpen: () => void }> = ({ items, isActive, go, onOpen }) => (
  <aside className="hidden md:flex w-16 bg-white border-r border-slate-200 flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
    <button type="button" onClick={onOpen} aria-label="Mở menu" title="Mở menu" className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
      <Menu className="w-5 h-5" />
    </button>
    {items.map(({ path, label, Icon, badge }) => (
      <button
        key={path}
        type="button"
        title={label}
        aria-label={label}
        onClick={() => go(path)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${isActive(path) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <Icon className="w-5 h-5" />
        {!!badge && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />}
      </button>
    ))}
  </aside>
);

/**
 * Phần đầu menu bên dùng chung cho mọi vai trò: nền sáng, viền nhẹ, cùng bảng màu slate/blue với các trang.
 * [onLogoClick] chỉ truyền cho khách hàng (logo quay về trang chủ); các vai trò khác logo không bấm được.
 */
export const SidebarHeader: React.FC<{
  roleLabel?: string;
  name: string;
  subtitle?: string;
  mono?: boolean;
  online?: boolean;
  onClose: () => void;
  onLogoClick?: () => void;
  children?: React.ReactNode;
}> = ({ roleLabel, name, subtitle, mono, online, onClose, onLogoClick, children }) => {
  const logo = (
    <>
      <BrandLogo className="w-8 h-8 rounded-xl" />
      <span className="text-xl font-black tracking-tight text-slate-900">
        Mod<span className="text-blue-600">Move</span>
      </span>
    </>
  );
  return (
    <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2 min-w-0">
          {onLogoClick ? (
            <button type="button" onClick={onLogoClick} title="Về trang chủ" aria-label="ModMove - Về trang chủ" className="flex items-center gap-2 rounded-xl hover:opacity-80 transition">
              {logo}
            </button>
          ) : (
            <div className="flex items-center gap-2">{logo}</div>
          )}
          {roleLabel && <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">{roleLabel}</span>}
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng menu" title="Đóng menu" className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-black text-sm flex items-center justify-center">{name.charAt(0).toUpperCase() || '?'}</div>
            {online !== undefined && <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-slate-900 truncate">{name}</div>
            {subtitle && <div className={`text-[11px] text-slate-500 truncate ${mono ? 'font-mono' : ''}`}>{subtitle}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

/** Thanh trên cùng cho màn hẹp (< md): nút mở menu + logo. [onLogoClick] chỉ khách hàng dùng (về trang chủ). */
export const MobileTopBar: React.FC<{ onOpen: () => void; onLogoClick?: () => void; right?: React.ReactNode }> = ({ onOpen, onLogoClick, right }) => {
  const logo = (
    <>
      <BrandLogo className="w-8 h-8 rounded-lg" />
      <span className="text-lg font-black tracking-tight text-slate-900">
        Mod<span className="text-blue-600">Move</span>
      </span>
    </>
  );
  return (
    <header className="md:hidden h-14 flex items-center gap-2 px-2 bg-white border-b border-slate-200 flex-shrink-0 z-30">
      <button type="button" onClick={onOpen} aria-label="Mở menu" className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center">
        <Menu className="w-5 h-5" />
      </button>
      {onLogoClick ? (
        <button type="button" onClick={onLogoClick} aria-label="ModMove - Về trang chủ" className="flex items-center gap-2">
          {logo}
        </button>
      ) : (
        <div className="flex items-center gap-2">{logo}</div>
      )}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </header>
  );
};

/** Menu trượt cho màn hẹp: bấm nền tối để đóng. */
export const MobileDrawer: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) =>
  open ? (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[85vw] max-w-xs h-full shadow-2xl z-50">{children}</div>
    </div>
  ) : null;
