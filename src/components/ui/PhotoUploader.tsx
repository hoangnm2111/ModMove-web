import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { BUSINESS } from '../../config/business';
import { validatePhotoFile } from '../../domain/validators';

interface PhotoUploaderProps {
  value: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
  /** Khi có: upload thật lên backend (Cloudinary) và lưu URL trả về. Không có: chỉ xem trước cục bộ (chưa có API upload cho luồng này). */
  upload?: (file: File) => Promise<string>;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/** Upload ảnh theo GB-06: JPG/PNG ≤ 5MB, giới hạn số lượng */
export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ value, onChange, max = BUSINESS.MAX_CARGO_PHOTOS, label, hint, upload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const room = max - value.length;
    const list = Array.from(files);
    if (list.length > room) setError(`Chỉ được tải tối đa ${max} ảnh.`);
    const toAccept = list.slice(0, Math.max(0, room));
    const validFiles: File[] = [];
    for (const f of toAccept) {
      const err = validatePhotoFile(f);
      if (err) setError(err);
      else validFiles.push(f);
    }
    if (validFiles.length === 0) return;
    setUploading(true);
    try {
      const accepted: string[] = [];
      for (const f of validFiles) {
        try {
          accepted.push(upload ? await upload(f) : await readAsDataUrl(f));
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Tải ảnh lên thất bại.');
        }
      }
      if (accepted.length) onChange([...value, ...accepted]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          <span className="text-[11px] font-semibold text-slate-400">
            {value.length}/{max}
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
            <img src={src} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              aria-label="Xoá ảnh"
              className="absolute top-1 right-1 p-1 rounded-lg bg-white/90 text-rose-600 opacity-90 hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-slate-400 hover:text-brand-600 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            {uploading ? 'Đang tải...' : 'Thêm ảnh'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple hidden disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
