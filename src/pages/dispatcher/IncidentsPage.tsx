import React, { useState } from 'react';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_STATUS, INCIDENT_TYPE } from '../../api/labels';
import type { IncidentResolutionStatus, IncidentType } from '../../api/types';
import { Card, DataState, PageShell, Pager, Pill, SearchBox, Select, StatusPill, Table, Tabs } from '../../components/ui/kit';
import { IncidentDrawer } from '../../features/dispatcher/IncidentDrawer';
import { DispatcherOrderDrawer } from '../../features/dispatcher/DispatcherOrderDrawer';
import { formatDateTime, timeAgo } from '../../utils/format';

type StatusTab = IncidentResolutionStatus | 'ALL';
const TABS: { key: StatusTab; label: string }[] = [
  { key: 'Open', label: 'Mới' },
  { key: 'InProgress', label: 'Đang xử lý' },
  { key: 'Resolved', label: 'Đã xử lý' },
  { key: 'Cancelled', label: 'Đã huỷ' },
  { key: 'ALL', label: 'Tất cả' },
];
const TYPE_OPTS = [{ value: '', label: 'Mọi loại sự cố' }, ...(Object.keys(INCIDENT_TYPE) as IncidentType[]).map((t) => ({ value: t, label: INCIDENT_TYPE[t] }))];

/** UC-DIS-03/04 – Danh sách sự cố: GET /dispatcher/Incidents */
export const IncidentsPage: React.FC = () => {
  const [tab, setTab] = useState<StatusTab>('Open');
  const [type, setType] = useState<IncidentType | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const filters = { status: tab === 'ALL' ? undefined : tab, incidentType: type || undefined, search: search.trim() };
  const q = useQuery(() => dispatcherApi.incidents({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page], { refreshMs: 30_000 });

  return (
    <PageShell
      title="Sự cố vận chuyển"
      subtitle="Tiếp nhận, đối chiếu bằng chứng và quyết định: tiếp tục chuyến, đổi tài xế hoặc huỷ đơn"
      toolbar={
        <div className="w-full flex flex-wrap items-center gap-2">
          <Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={type} onChange={(e) => (setType(e.target.value as IncidentType | ''), setPage(1))} options={TYPE_OPTS} />
            <SearchBox value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Mã đơn, người báo…" />
          </div>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        <Card padded>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(r) => r.id}
                  onRow={(r) => setOpenId(r.id)}
                  cols={[
                    { head: 'Sự cố', cell: (r) => <b className="text-slate-900">#{r.id}</b> },
                    {
                      head: 'Loại / mô tả',
                      cell: (r) => (
                        <div className="max-w-xs">
                          <div className="font-bold">{INCIDENT_TYPE[r.incidentType]}</div>
                          <div className="text-slate-500 truncate">{r.description}</div>
                        </div>
                      ),
                    },
                    {
                      head: 'Đơn',
                      cell: (r) => (
                        <div className="space-y-1">
                          <button className="font-bold text-blue-700 hover:underline" onClick={(e) => (e.stopPropagation(), setOrderId(r.orderId))}>
                            {r.orderCode}
                          </button>
                          <div>
                            <StatusPill status={r.orderStatus} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      head: 'Người báo',
                      cell: (r) => (
                        <div>
                          <div className="font-semibold">{r.reporterName}</div>
                          <div className="text-[11px] text-slate-400">{r.reporterRole === 'Driver' ? 'Tài xế' : 'Khách hàng'}</div>
                        </div>
                      ),
                    },
                    {
                      head: 'Trạng thái',
                      cell: (r) => (
                        <div className="space-y-1">
                          <Pill tone={INCIDENT_STATUS[r.resolutionStatus]} />
                          {r.handledByName && <div className="text-[11px] text-slate-400">{r.handledByName}</div>}
                        </div>
                      ),
                    },
                    {
                      head: 'Thời gian',
                      cell: (r) => (
                        <div>
                          <div>{formatDateTime(r.createdAt)}</div>
                          <div className="text-[11px] text-slate-400">{timeAgo(r.createdAt)}</div>
                        </div>
                      ),
                    },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId && <IncidentDrawer incidentId={openId} onClose={() => setOpenId(null)} onChanged={() => q.reload()} onOpenOrder={(id) => (setOpenId(null), setOrderId(id))} />}
      {orderId && <DispatcherOrderDrawer orderId={orderId} onClose={() => setOrderId(null)} onOpenIncident={(id) => (setOrderId(null), setOpenId(id))} />}
    </PageShell>
  );
};
