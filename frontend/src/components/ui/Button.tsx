import React from 'react';

type ButtonVariant = 'success' | 'danger' | 'info' | 'subtle' | 'outline' | 'inverse';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'subtle',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    success: 'bg-success text-text-inverse hover:bg-success-hover shadow-sm',
    danger: 'bg-danger text-text-inverse hover:bg-danger-hover shadow-sm',
    info: 'bg-info text-text-inverse hover:bg-info-hover shadow-sm',
    subtle: 'bg-surface-subtle text-text-primary hover:bg-surface-hover border border-border-default',
    outline: 'bg-surface-card text-text-primary border border-border-default hover:bg-surface-subtle',
    inverse: 'bg-surface-inverse text-text-inverse hover:opacity-90',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`min-h-touch inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all select-none ${
        variantStyles[variant]
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'} ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

