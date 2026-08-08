import { ReactNode } from 'react';
import clsx from 'clsx';

export function Badge({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full border border-ink px-2.5 py-0.5 text-xs font-medium',
      {
        'bg-cream text-ink': variant === 'default',
        'bg-mint text-ink': variant === 'success',
        'bg-sunshine text-ink': variant === 'warning',
        'bg-red-100 text-red-800': variant === 'danger',
      },
      className
    )}>
      {children}
    </span>
  );
}
