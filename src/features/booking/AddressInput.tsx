import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { mapService } from '../../services/map.service';
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
 * Ô nhập địa chỉ có gợi ý (API-MAP-01). Địa chỉ chỉ hợp lệ khi được chọn từ gợi ý
 * (có toạ độ) – tương ứng MSG28.
 */
export const AddressInput: React.FC<AddressInputProps> = ({ id, label, value, error, onSelect, onType }) => {
  const [open, setOpen] = useState(false);
  const suggestions = mapService.searchPlaces(value);

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
          placeholder="Nhập và chọn địa chỉ trong Hà Nội…"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            onType(e.target.value);
            setOpen(true);
          }}
          aria-invalid={Boolean(error)}
          className={`${inputClass(Boolean(error))} pl-9`}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((p) => (
            <li key={p.address}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                {p.address}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
