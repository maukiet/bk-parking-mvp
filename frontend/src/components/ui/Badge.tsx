import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-success-surface text-success-text border-success-border',
    danger: 'bg-danger-surface text-danger-text border-danger-border',
    warning: 'bg-warning-surface text-warning-text border-warning-border',
    info: 'bg-info-surface text-info-text border-info-border',
    neutral: 'bg-surface-subtle text-text-secondary border-border-default',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

