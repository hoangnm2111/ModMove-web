import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, PenLine } from 'lucide-react';
import { GeoPoint, mapService, primeLocationBias } from '../../services/map.service';
import { inputClass } from '../../components/ui/Field';

interface AddressInputProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onSelect: (place: { address: string; lat: number; lng: number }) => void;
  onType: (address: string) => void;
}

/**
 * Ô nhập địa chỉ có gợi ý thật (Photon/OpenStreetMap, debounce 350ms).
 * Khách có thể chọn gợi ý (có toạ độ để vẽ bản đồ) hoặc giữ nguyên địa chỉ đã gõ –
 * backend luôn tự tìm toạ độ bằng MapVina khi báo giá và tạo đơn.
 */
export const AddressInput: React.FC<AddressInputProps> = ({ id, label, value, error, onSelect, onType }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => primeLocationBias(), []);

  useEffect(() => {
    if (!dirty) return;
    const q = value.trim();
    if (q.length < 3) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setLoading(true);
      setFailed(false);
      try {
        setItems(await mapService.searchPlaces(q, c.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setItems([]);
          setFailed(true);
        }
      } finally {
        if (ctrl.current === c) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [value, dirty]);

  const pick = (p: GeoPoint) => {
    onSelect(p);
    setDirty(false);
    setOpen(false);
  };
  const showList = open && dirty && value.trim().length >= 3;

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          value={value}
          autoComplete="off"
          placeholder="Nhập số nhà, tên đường, phường/quận, tỉnh/thành…"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            onType(e.target.value);
            setDirty(true);
            setOpen(true);
          }}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          aria-invalid={Boolean(error)}
          aria-autocomplete="list"
          className={`${inputClass(Boolean(error))} pl-9 pr-9`}
        />
        {loading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>
      {showList && (
        <ul className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto" role="listbox">
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setDirty(false);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-start gap-2 border-b border-slate-100"
            >
              <PenLine className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>
                Dùng đúng địa chỉ đã nhập: <b>{value.trim()}</b>
              </span>
            </button>
          </li>
          {items.map((p) => (
            <li key={`${p.address}-${p.lat}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                {p.address}
              </button>
            </li>
          ))}
          {!loading && items.length === 0 && (
            <li className="px-3 py-2 text-[11px] text-slate-400">{failed ? 'Không tải được gợi ý – bạn vẫn có thể dùng địa chỉ đã nhập.' : 'Không có gợi ý phù hợp.'}</li>
          )}
        </ul>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
