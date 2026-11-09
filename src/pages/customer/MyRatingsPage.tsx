import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { customerApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { DataState, PageShell, Pager, cx } from '../../components/ui/kit';
import { formatDateTime } from '../../utils/format';

/** UC-CUS-26 – Đánh giá đã gửi: GET /customer/Ratings */
export const MyRatingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const q = useQuery(() => customerApi.ratings(page, 10), [page]);
  return (
    <PageShell title="Đánh giá của tôi" subtitle="Các đánh giá bạn đã gửi cho tài xế (mỗi đơn một lần, không sửa được)">
      <div className="max-w-3xl mx-auto">
        <DataState q={q} empty={(d) => d.items.length === 0}>
          {(d) => (
            <>
              <ul className="space-y-3">
                {d.items.map((r) => (
                  <li key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => navigate(`/orders/${r.orderId}`)} className="font-black text-sm text-blue-700 hover:underline">
                        {r.orderCode}
                      </button>
                      <span className="text-xs text-slate-500">• Tài xế {r.driverName}</span>
                      <span className="ml-auto text-[11px] text-slate-400">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cx('w-4 h-4', n <= r.ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                      ))}
                    </div>
                    {r.reviewComment && <p className="text-sm text-slate-700 mt-1">“{r.reviewComment}”</p>}
                  </li>
                ))}
              </ul>
              <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
            </>
          )}
        </DataState>
      </div>
    </PageShell>
  );
};
