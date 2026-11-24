/** Giờ Việt Nam cho mọi thời điểm hiển thị, không phụ thuộc múi giờ của máy (DECISIONS 9.5: lưu UTC). */
export const VN_TZ = 'Asia/Ho_Chi_Minh';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
}

export const formatDateTime = formatDate;

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Quãng đường trong ô Ước tính cước phí: làm tròn LÊN (không bao giờ thấp hơn thực tế), không hiện số lẻ. */
export function formatDistanceCeil(km: number): string {
  return `${Math.ceil(km)} km`;
}

/**
 * Tiền làm tròn LÊN bội số 1.000đ. BE đã tính cước theo nghìn đồng nên với đơn mới số hiển thị trùng số thanh toán;
 * hàm này chỉ giữ cho các đơn cũ còn số lẻ.
 */
export function formatCurrencyCeil1000(amount: number): string {
  return formatCurrency(Math.ceil(amount / 1000) * 1000);
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} giây trước`;
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}

/** Xuất CSV (có BOM để Excel hiển thị đúng tiếng Việt) */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
