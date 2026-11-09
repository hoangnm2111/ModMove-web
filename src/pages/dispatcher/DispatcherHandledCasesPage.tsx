import React, { useState } from 'react';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_TYPE } from '../../api/labels';
import type { HandledCaseType } from '../../api/types';
import { Card, DataState, PageShell, Pager, Table, Tabs } from '../../components/ui/kit';
import { DispatcherOrderDrawer } from '../../features/dispatcher/DispatcherOrderDrawer';
import { formatCurrency, formatDateTime } from '../../utils/format';

type Tab = HandledCaseType | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'Incident', label: 'Sự cố' },
  { key: 'Complaint', label: 'Khiếu nại' },
  { key: 'IncidentRefund', label: 'Hoàn tiền sự cố' },
  { key: 'Refund', label: 'Đề xuất hoàn tiền' },
];
const KIND: Record<string, string> = { Incident: 'Sự cố', Complaint: 'Khiếu nại', IncidentRefund: 'Hoàn tiền sự cố', Refund: 'Hoàn tiền' };
const label = (v: string | null) => (v ? (INCIDENT_DECISION as Record<string, string>)[v] ?? (INCIDENT_TYPE as Record<string, string>)[v] ?? v : '—');

/** UC-DIS-16 – Ca tôi đã xử lý: GET /dispatcher/handled-cases */
export const DispatcherHandledCasesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);
  const [orderId, setOrderId] = useState<number | null>(null);
  const q = useQuery(() => dispatcherApi.handledCases(tab === 'ALL' ? undefined : tab, page, 20), [tab, page]);
  return (
    <PageShell title="Lịch sử xử lý của tôi" subtitle="Các sự cố tôi đã quyết định và các đề xuất hoàn tiền tôi đã gửi" toolbar={<Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />}>
      <div className="max-w-6xl mx-auto">
        <Card>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(r) => `${r.caseKind}-${r.caseId}`}
                  onRow={(r) => setOrderId(r.orderId)}
                  cols={[
                    {
                      head: 'Loại',
                      cell: (r) => (
                        <div>
                          <b>{KIND[r.caseKind] ?? r.caseKind}</b> #{r.caseId}
                          <div className="text-[11px] text-slate-400">{label(r.subType)}</div>
                        </div>
                      ),
                    },
                    { head: 'Đơn', cell: (r) => <span className="font-bold text-blue-700">{r.orderCode}</span> },
                    { head: 'Trạng thái', cell: (r) => r.status },
                    { head: 'Quyết định', cell: (r) => label(r.decision) },
                    {
                      head: 'Số tiền',
                      cell: (r) =>
                        r.requestedAmount !== null ? (
                          <span>
                            {formatCurrency(r.requestedAmount)}
                            {r.proposedAmount !== null && <span className="text-blue-700"> • Đề xuất {formatCurrency(r.proposedAmount)}</span>}
                          </span>
                        ) : (
                          '—'
                        ),
                    },
                    { head: 'Ghi chú', cell: (r) => <div className="max-w-xs truncate text-slate-600">{r.note ?? '—'}</div> },
                    { head: 'Xử lý lúc', cell: (r) => formatDateTime(r.handledAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {orderId && <DispatcherOrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />}
    </PageShell>
  );
};
