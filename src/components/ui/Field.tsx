import React from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: React.ReactNode;
}

export const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 transition ${
    hasError ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
  }`;

/** Ô nhập có nhãn + lỗi inline (MSG01/MSG02) */
export const Field: React.FC<FieldProps> = ({ label, error, hint, icon, id, className = '', ...props }) => {
  const fieldId = id ?? `f_${label.replace(/\s+/g, '_')}`;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-xs font-bold text-slate-700 mb-1">
        {label}
        {props.required && <span className="text-rose-500"> *</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input id={fieldId} aria-invalid={Boolean(error)} className={`${inputClass(Boolean(error))} ${icon ? 'pl-9' : ''}`} {...props} />
      </div>
      {error ? <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p> : hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string | null }> = ({ label, error, id, ...props }) => {
  const fieldId = id ?? `t_${label.replace(/\s+/g, '_')}`;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold text-slate-700 mb-1">
        {label}
        {props.required && <span className="text-rose-500"> *</span>}
      </label>
      <textarea id={fieldId} rows={3} className={inputClass(Boolean(error))} {...props} />
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
