import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}

export const StatCard = ({ label, value, hint, accent }: StatCardProps) => (
  <div className="rounded-[var(--radius-card)] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-panel)]">
    <p className="text-[12px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
    <p
      className={cn(
        'mt-2 font-display text-[28px] font-semibold leading-none tabular-nums',
        accent ? 'text-accent-600' : 'text-text-primary'
      )}
    >
      {value}
    </p>
    {hint && <p className="mt-1.5 text-[12px] text-text-tertiary">{hint}</p>}
  </div>
);
