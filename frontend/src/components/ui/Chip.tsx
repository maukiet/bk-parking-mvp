import React from 'react';

interface ChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ active, label, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 px-4 py-1.5 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-1.5 select-none ${
        active
          ? 'bg-surface-inverse text-text-inverse'
          : 'bg-surface-card text-text-primary border border-border-default hover:bg-surface-subtle'
      } ${className}`}
    >
      {active && <span className="text-xs">✓</span>}
      <span>{label}</span>
    </button>
  );
};

