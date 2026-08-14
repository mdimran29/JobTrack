import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    {icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-text-tertiary">
        {icon}
      </div>
    )}
    <div className="space-y-1">
      <p className="font-display text-[15px] font-semibold text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-text-secondary">{description}</p>}
    </div>
    {action}
  </div>
);
