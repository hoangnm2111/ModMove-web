import React from 'react';
import { Menu } from 'lucide-react';

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
  <aside className="w-14 sm:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
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
