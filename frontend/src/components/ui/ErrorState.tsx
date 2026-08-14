import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-rejected-bg text-status-rejected-text">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 6.5v4M10 13.5h.01M17.5 10a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="space-y-1">
      <p className="font-display text-[15px] font-semibold text-text-primary">Couldn't load this</p>
      <p className="max-w-sm text-[13px] text-text-secondary">
        {message ?? 'Something went wrong while fetching this data.'}
      </p>
    </div>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
