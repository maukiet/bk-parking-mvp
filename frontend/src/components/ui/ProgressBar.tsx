import React from 'react';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const percentage = Math.min(100, Math.max(0, value));

  const barColor =
    percentage >= 90 ? 'bg-danger' : percentage >= 75 ? 'bg-warning-default' : 'bg-success';

  return (
    <div className={`w-full h-2 bg-surface-subtle rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-300 rounded-full ${barColor}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

