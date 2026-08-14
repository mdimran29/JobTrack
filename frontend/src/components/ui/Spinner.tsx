import { cn } from '../../lib/utils';

export const Spinner = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-text-tertiary',
      className
    )}
    role="status"
    aria-label="Loading"
  />
);
