import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

type BannerVariant = 'success' | 'warning' | 'danger' | 'info';

interface BannerProps {
  variant: BannerVariant;
  title: string;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({ variant, title, className = '' }) => {
  const configs: Record<BannerVariant, { style: string; icon: React.ReactNode }> = {
    success: {
      style: 'bg-success-surface border-success-border text-success-text',
      icon: <CheckCircle2 className="w-6 h-6 text-success shrink-0" />,
    },
    warning: {
      style: 'bg-warning-surface border-warning-border text-warning-text',
      icon: <AlertTriangle className="w-6 h-6 text-warning-default shrink-0" />,
    },
    danger: {
      style: 'bg-danger-surface border-danger-border text-danger-text',
      icon: <XCircle className="w-6 h-6 text-danger shrink-0" />,
    },
    info: {
      style: 'bg-info-surface border-info-border text-info-text',
      icon: <Info className="w-6 h-6 text-info shrink-0" />,
    },
  };

  const current = configs[variant];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${current.style} ${className}`}>
      {current.icon}
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
    </div>
  );
};

