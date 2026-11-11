import React from 'react';
import { Phone } from 'lucide-react';

/**
 * Số điện thoại kèm nút gọi: bấm biểu tượng điện thoại để mở ứng dụng gọi điện (liên kết `tel:`).
 * Trên điện thoại sẽ mở trình quay số; trên máy tính mở ứng dụng gọi mặc định nếu có.
 * Bấm nút không kích hoạt thao tác của hàng bảng hoặc thẻ chứa nó.
 */
export const PhoneLink: React.FC<{ phone?: string | null; className?: string }> = ({ phone, className = '' }) => {
  const value = (phone ?? '').trim();
  if (!value) return <span className="text-slate-400">—</span>;
  const dial = value.replace(/[^\d+]/g, '');
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{value}</span>
      <a
        href={`tel:${dial}`}
        title={`Gọi ${value}`}
        aria-label={`Gọi ${value}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex-shrink-0"
      >
        <Phone className="w-3.5 h-3.5" />
      </a>
    </span>
  );
};
