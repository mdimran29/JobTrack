import { ApplicationStatus, PIPELINE_STAGES } from '../../types';
import { STATUS_LABELS, cn } from '../../lib/utils';

export const PipelineStageIndicator = ({ status }: { status: ApplicationStatus }) => {
  const isTerminal = status === 'REJECTED' || status === 'WITHDRAWN';
  const currentIndex = PIPELINE_STAGES.indexOf(status);

  return (
    <div className="flex items-center gap-1.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const reached = !isTerminal && i <= currentIndex;
        const isCurrent = !isTerminal && i === currentIndex;
        return (
          <div key={stage} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                reached ? 'bg-accent-500' : 'bg-border'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                isCurrent ? 'text-accent-600' : 'text-text-tertiary'
              )}
            >
              {STATUS_LABELS[stage]}
            </span>
          </div>
        );
      })}
      {isTerminal && (
        <span
          className={cn(
            'ml-2 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
            status === 'REJECTED'
              ? 'bg-status-rejected-bg text-status-rejected-text'
              : 'bg-status-withdrawn-bg text-status-withdrawn-text'
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      )}
    </div>
  );
};
