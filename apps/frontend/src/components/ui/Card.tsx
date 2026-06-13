import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}
