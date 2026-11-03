import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

/** Outlet có Suspense riêng: khi lazy-load trang con, layout vẫn giữ nguyên */
export const SuspenseOutlet: React.FC = () => (
  <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-10">Đang tải…</div>}>
    <Outlet />
  </Suspense>
);
