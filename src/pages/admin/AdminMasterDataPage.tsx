import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field, TextArea } from '../../components/ui/Field';
import { Card, DataState, PageShell, Pill, SearchBox, Table, Tabs } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { MASTER_CATEGORY } from '../../api/labels';
import type { MasterDataCategory, MasterDataItemDto } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime } from '../../utils/format';

const CATS = Object.keys(MASTER_CATEGORY) as MasterDataCategory[];
const ON = { label: 'Đang bật', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
const OFF = { label: 'Đã tắt', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

/** UC-ADM-14/15/16 – Danh mục hệ thống & nội dung (chính sách, giới thiệu, loại hàng, lý do…) */
export const AdminMasterDataPage: React.FC = () => {
  const [cat, setCat] = useState<MasterDataCategory>('POLICY');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<MasterDataItemDto | 'new' | null>(null);
  const all = useQuery(() => adminApi.masterData(), []);
  const items = (all.data ?? []).filter((i) => i.category === cat).filter((i) => {
    const s = search.trim().toLowerCase();
    return !s || i.code.toLowerCase().includes(s) || i.name.toLowerCase().includes(s);
  });
  const toggle = async (i: MasterDataItemDto) => {
    try {
      await adminApi.setMasterDataActive(i.id, !i.isActive);
      toast.success(`${i.isActive ? 'Đã tắt' : 'Đã bật'} “${i.name}”.`);
      await all.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <PageShell
      title="Danh mục hệ thống"
      subtitle="Nội dung hiển thị cho khách và danh sách lựa chọn dùng khi đặt đơn, huỷ, khiếu nại"
      actions={
        <Button size="sm" onClick={() => setEdit('new')}>
          <Plus className="w-4 h-4 mr-1" /> Thêm mục
        </Button>
      }
      toolbar={
        <div className="w-full flex flex-wrap items-center gap-2">
          <Tabs value={cat} onChange={setCat} items={CATS.map((c) => ({ key: c, label: MASTER_CATEGORY[c].label, count: (all.data ?? []).filter((i) => i.category === c).length }))} />
          <SearchBox className="ml-auto" value={search} onChange={setSearch} placeholder="Mã, tên…" />
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-3">
        <Banner kind="info">
          <b>{MASTER_CATEGORY[cat].label}:</b> {MASTER_CATEGORY[cat].hint}. Mục bị tắt không hiển thị cho khách; mã đã tắt gửi lên sẽ bị từ chối.
        </Banner>
        <Card>
          <DataState q={all}>
            {() =>
              items.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Chưa có mục nào.</p>
              ) : (
                <Table
                  rows={items}
                  rowKey={(i) => i.id}
                  cols={[
                    { head: 'Mã', cell: (i) => <span className="font-mono font-bold">{i.code}</span> },
                    { head: 'Tên', cell: (i) => <b>{i.name}</b> },
                    { head: 'Mô tả / nội dung', cell: (i) => <div className="max-w-md text-slate-600 line-clamp-2 whitespace-pre-line">{i.description ?? '—'}</div> },
                    { head: 'Trạng thái', cell: (i) => <Pill tone={i.isActive ? ON : OFF} /> },
                    { head: 'Cập nhật', cell: (i) => formatDateTime(i.updatedAt ?? i.createdAt) },
                    {
                      head: '',
                      className: 'text-right',
                      cell: (i) => (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEdit(i)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggle(i)}>
                            {i.isActive ? 'Tắt' : 'Bật'}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              )
            }
          </DataState>
        </Card>
      </div>
      {edit && <EditModal category={cat} item={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onDone={() => (setEdit(null), all.reload())} />}
    </PageShell>
  );
};

const EditModal: React.FC<{ category: MasterDataCategory; item: MasterDataItemDto | null; onClose: () => void; onDone: () => void }> = ({ category, item, onClose, onDone }) => {
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [desc, setDesc] = useState(item?.description ?? '');
  const [busy, setBusy] = useState(false);
  const long = category === 'POLICY' || category === 'SERVICE_INFO';
  const submit = async () => {
    if (!item && !/^[A-Z0-9_-]{1,50}$/.test(code)) return toast.error('Mã tối đa 50 ký tự, chữ IN HOA, số, gạch dưới.');
    if (!name.trim()) return toast.error('Nhập tên.');
    setBusy(true);
    try {
      if (item) await adminApi.updateMasterData(item.id, name.trim(), desc.trim() || null);
      else await adminApi.createMasterData(category, code, name.trim(), desc.trim() || null);
      toast.success('Đã lưu danh mục.');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="lg"
      title={item ? `Sửa: ${item.name}` : `Thêm mục – ${MASTER_CATEGORY[category].label}`}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Mã" required value={code} disabled={!!item} onChange={(e) => setCode(e.target.value.toUpperCase())} hint={item ? 'Mã không đổi được sau khi tạo' : 'VD: FURNITURE, OTHER'} />
        <Field label="Tên hiển thị" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextArea label={long ? 'Nội dung (hiển thị cho khách)' : 'Mô tả'} rows={long ? 10 : 3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
    </Modal>
  );
};
