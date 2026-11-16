import React, { useState } from 'react';
import { Banner } from '../../components/ui/feedback';
import { Card, DataState, Drawer, KV, PageShell, Pager, PhotoGrid, Pill, Table, Tabs } from '../../components/ui/kit';
import { driverApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, ORDER_STATUS } from '../../api/labels';
import type { DriverIncidentResponse, IncidentResolutionStatus } from '../../api/types';
import { formatDateTime } from '../../utils/format';

type Tab = IncidentResolutionStatus | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'Open', label: 'Đang chờ xử lý' },
  { key: 'InProgress', label: 'Đang xử lý' },
  { key: 'Resolved', label: 'Đã xử lý' },
  { key: 'Cancelled', label: 'Đã hủy' },
];

/** Sự cố của tôi (GET /driver/incidents): sự cố tôi báo, và sự cố khách báo trên đơn đang giao cho tôi (chỉ thấy câu chung). */
export const DriverIncidentsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const status = tab === 'ALL' ? undefined : tab;
  const q = useQuery(() => driverApi.incidents({ status, page, pageSize: 20 }), [tab, page], { refreshMs: 15_000 });

  return (
    <PageShell
      title="Sự cố của tôi"
      subtitle="Theo dõi trạng thái xử lý và quyết định của điều phối viên cho các sự cố bạn đã báo hoặc khách đã báo trên đơn của bạn"
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />
        </div>
      }
    >
      <div className="w-full space-y-4">
        <Banner kind="warning">Sự cố do bạn báo đang chờ xử lý sẽ làm chuyến tạm dừng: bạn chưa thể xác nhận đến nơi, lấy hàng hay giao hàng cho tới khi điều phối viên xử lý xong.</Banner>
        <Card padded={false}>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(i) => i.id}
                  onRow={(i) => setOpenId(i.id)}
                  cols={[
                    { head: 'Sự cố', cell: (i) => <b>#{i.id}</b> },
                    { head: 'Đơn hàng', cell: (i) => i.orderCode },
                    { head: 'Loại', cell: (i) => INCIDENT_TYPE[i.incidentType] },
                    { head: 'Ai báo', cell: (i) => (i.reportedByYou ? 'Bạn báo' : 'Khách báo') },
                    { head: 'Trạng thái', cell: (i) => <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} /> },
                    { head: 'Chặn chuyến', cell: (i) => (i.reportedByYou && (i.resolutionStatus === 'Open' || i.resolutionStatus === 'InProgress') ? <span className="text-rose-600 font-bold">Có</span> : '—') },
                    { head: 'Thời gian', cell: (i) => formatDateTime(i.createdAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId !== null && <IncidentDrawer id={openId} onClose={() => setOpenId(null)} />}
    </PageShell>
  );
};

const IncidentDrawer: React.FC<{ id: number; onClose: () => void }> = ({ id, onClose }) => {
  const q = useQuery(() => driverApi.incident(id), [id], { refreshMs: 15_000 });
  return (
    <Drawer open onClose={onClose} title={q.data ? <>Sự cố #{q.data.id} <Pill tone={INCIDENT_STATUS[q.data.resolutionStatus]} /></> : 'Sự cố'}>
      <DataState q={q}>{(i) => <IncidentDetail i={i} />}</DataState>
    </Drawer>
  );
};

const IncidentDetail: React.FC<{ i: DriverIncidentResponse }> = ({ i }) => (
  <div className="space-y-3">
    <Card title="Thông tin">
      <KV label="Đơn hàng">
        {i.orderCode} • {ORDER_STATUS[i.orderStatus].label}
      </KV>
      <KV label="Loại sự cố">{INCIDENT_TYPE[i.incidentType]}</KV>
      <KV label="Ai báo">{i.reportedByYou ? 'Bạn báo' : 'Khách báo'}</KV>
      <KV label="Báo lúc">{formatDateTime(i.createdAt)}</KV>
      <KV label="Vị trí">{i.latitude !== null && i.longitude !== null ? `${i.latitude.toFixed(5)}, ${i.longitude.toFixed(5)}` : '—'}</KV>
    </Card>
    <Card title="Mô tả">
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{i.description}</p>
      {i.reportedByYou && (
        <div className="mt-3">
          <PhotoGrid urls={i.photoUrls} emptyText="Không có ảnh" />
        </div>
      )}
    </Card>
    <Card title="Xử lý của điều phối viên">
      {i.resolutionStatus === 'Open' && <p className="text-sm text-slate-600">Đang chờ điều phối viên nhận xử lý.</p>}
      {i.resolutionStatus === 'InProgress' && <p className="text-sm text-amber-700 font-semibold">Điều phối viên đang xử lý sự cố này.</p>}
      {i.resolutionStatus === 'Resolved' && i.resolutionDecision && (
        <>
          <KV label="Quyết định">{INCIDENT_DECISION[i.resolutionDecision]}</KV>
          <KV label="Ghi chú">{i.resolutionNote ?? '—'}</KV>
          <KV label="Xử lý lúc">{i.resolvedAt ? formatDateTime(i.resolvedAt) : '—'}</KV>
        </>
      )}
      {i.resolutionStatus === 'Cancelled' && <p className="text-sm text-slate-600">Báo cáo đã bị hủy{i.resolutionNote ? `: ${i.resolutionNote}` : '.'}</p>}
    </Card>
  </div>
);
