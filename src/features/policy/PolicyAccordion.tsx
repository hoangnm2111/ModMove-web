import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { LookupItem } from '../../services/catalog.service';

/** Danh sách chính sách do BE trả về: mỗi mục mở ra để đọc nội dung nhiều dòng. */
export const PolicyAccordion: React.FC<{ items: LookupItem[]; emptyText?: string }> = ({ items, emptyText = 'Chưa có chính sách nào.' }) => {
  if (items.length === 0) return <p className="text-slate-500 text-center py-6">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <details key={p.code} className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 font-extrabold text-slate-900">
            {p.name}
            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 px-3.5 py-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
            {p.description?.trim() ? p.description : 'Nội dung đang được cập nhật.'}
          </div>
        </details>
      ))}
    </div>
  );
};
