import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('bg-cream rounded-xl border border-ink p-6', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
