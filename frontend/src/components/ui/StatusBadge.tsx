import { ApplicationStatus } from '../../types';
import { STATUS_LABELS, cn } from '../../lib/utils';

const STYLES: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-status-applied-bg text-status-applied-text',
  SCREENING: 'bg-status-screening-bg text-status-screening-text',
  INTERVIEW: 'bg-status-interview-bg text-status-interview-text',
  TECHNICAL: 'bg-status-technical-bg text-status-technical-text',
  OFFER: 'bg-status-offer-bg text-status-offer-text',
  REJECTED: 'bg-status-rejected-bg text-status-rejected-text',
  WITHDRAWN: 'bg-status-withdrawn-bg text-status-withdrawn-text',
};

const DOT_STYLES: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-status-applied-text',
  SCREENING: 'bg-status-screening-text',
  INTERVIEW: 'bg-status-interview-text',
  TECHNICAL: 'bg-status-technical-text',
  OFFER: 'bg-status-offer-text',
  REJECTED: 'bg-status-rejected-text',
  WITHDRAWN: 'bg-status-withdrawn-text',
};

export const StatusBadge = ({ status, className }: { status: ApplicationStatus; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
      STYLES[status],
      className
    )}
  >
    <span className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[status])} />
    {STATUS_LABELS[status]}
  </span>
);
