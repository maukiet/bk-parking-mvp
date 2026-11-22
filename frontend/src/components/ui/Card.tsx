import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  headerTitle?: string;
  headerRight?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', headerTitle, headerRight }) => {
  return (
    <div
      className={`bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shadow-sm ${className}`}
    >
      {(headerTitle || headerRight) && (
        <div className="flex items-center justify-between shrink-0">
          {headerTitle && <h2 className="text-lg font-bold text-text-primary">{headerTitle}</h2>}
          {headerRight && <div className="text-sm text-text-secondary">{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

