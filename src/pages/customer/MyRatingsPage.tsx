import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Star } from 'lucide-react';
import { customerApi } from '../../api/endpoints';
import type { MyRatingResponse } from '../../api/types';
import { useQuery } from '../../api/useQuery';
import { DataState, PageShell, Pager, cx } from '../../components/ui/kit';
import { formatDateTime } from '../../utils/format';

const PAGE_SIZE = 12;

const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-4 h-4' }) => (
  <span className="inline-flex gap-0.5" aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={cx(size, n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
    ))}
  </span>
);

/** Tóm tắt các đánh giá đang hiển thị: điểm trung bình và số lượng theo từng mức sao. */
const Summary: React.FC<{ items: MyRatingResponse[]; total: number }> = ({ items, total }) => {
  const stats = useMemo(() => {
    const count = [0, 0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of items) {
      count[r.ratingStars] = (count[r.ratingStars] ?? 0) + 1;
      sum += r.ratingStars;
    }
    return { count, avg: items.length ? sum / items.length : 0 };
  }, [items]);
  return (
    <aside className="bg-white border border-slate-200 rounded-2xl p-5 lg:sticky lg:top-0 self-start">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Tổng quan</div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-4xl font-black text-slate-900 leading-none">{stats.avg.toFixed(1)}</div>
        <div className="pb-0.5">
          <Stars value={Math.round(stats.avg)} />
          <div className="text-[11px] text-slate-500 mt-1">{total} đánh giá đã gửi</div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const c = stats.count[n];
          const pct = items.length ? (c / items.length) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-slate-600 font-bold flex items-center gap-0.5">
                {n}
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-5 text-right text-slate-500 tabular-nums">{c}</span>
            </div>
          );
        })}
      </div>
      {total > items.length && <p className="text-[11px] text-slate-400 mt-3">Thống kê theo {items.length} đánh giá của trang này.</p>}
    </aside>
  );
};

/** UC-CUS-26 – Đánh giá đã gửi: GET /customer/Ratings */
export const MyRatingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const q = useQuery(() => customerApi.ratings(page, PAGE_SIZE), [page]);
  return (
    <PageShell title="Đánh giá của tôi" subtitle="Các đánh giá bạn đã gửi cho tài xế (mỗi đơn một lần, không sửa được)">
      <div className="w-full">
        <DataState q={q} empty={(d) => d.items.length === 0}>
          {(d) => (
            <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
              <Summary items={d.items} total={d.totalCount} />
              <div>
                <ul className="grid md:grid-cols-2 gap-3">
                  {d.items.map((r) => (
                    <li key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center flex-shrink-0">{r.driverName.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-sm text-slate-900 truncate">{r.driverName}</div>
                          <button onClick={() => navigate(`/orders/${r.orderId}`)} className="font-bold text-xs text-blue-700 hover:underline">
                            {r.orderCode}
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 text-right flex-shrink-0">{formatDateTime(r.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars value={r.ratingStars} />
                        <span className="text-xs font-bold text-slate-600">{r.ratingStars}/5</span>
                      </div>
                      {r.reviewComment ? (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2 break-words">“{r.reviewComment}”</p>
                      ) : (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MessageSquareText className="w-3.5 h-3.5" /> Không có nhận xét
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </div>
            </div>
          )}
        </DataState>
      </div>
    </PageShell>
  );
};
