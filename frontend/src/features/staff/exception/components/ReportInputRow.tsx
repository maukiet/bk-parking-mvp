import React from 'react';

interface ReportInputRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const ReportInputRow: React.FC<ReportInputRowProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
}) => (
  <div className="flex flex-col gap-1">
    <label className="font-bold text-text-secondary text-xs">{label}:</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="bg-surface-subtle border border-border-default rounded-xl px-3 py-1.5 text-text-primary text-xs font-semibold focus:outline-none"
    />
  </div>
);

