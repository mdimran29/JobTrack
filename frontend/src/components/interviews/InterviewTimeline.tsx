import { Interview } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { formatDateTime, INTERVIEW_TYPE_LABELS, cn } from '../../lib/utils';

const OUTCOME_STYLES: Record<Interview['outcome'], string> = {
  PENDING: 'bg-status-screening-bg text-status-screening-text',
  PASSED: 'bg-status-offer-bg text-status-offer-text',
  FAILED: 'bg-status-rejected-bg text-status-rejected-text',
  CANCELLED: 'bg-status-withdrawn-bg text-status-withdrawn-text',
};

const OUTCOME_LABELS: Record<Interview['outcome'], string> = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Not selected',
  CANCELLED: 'Cancelled',
};

interface InterviewTimelineProps {
  interviews: Interview[];
  onEdit: (interview: Interview) => void;
  onDelete: (interview: Interview) => void;
}

export const InterviewTimeline = ({ interviews, onEdit, onDelete }: InterviewTimelineProps) => {
  if (interviews.length === 0) {
    return (
      <EmptyState
        title="No interviews scheduled"
        description="Add one once you hear back and get a date on the calendar."
      />
    );
  }

  const sorted = [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <ul className="flex flex-col">
      {sorted.map((interview, i) => (
        <li key={interview.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < sorted.length - 1 && (
            <span className="absolute left-[7px] top-4 bottom-0 w-px bg-border" aria-hidden />
          )}
          <span className={cn('mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-surface', OUTCOME_STYLES[interview.outcome])} />
          <div className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-border bg-canvas/60 px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  {INTERVIEW_TYPE_LABELS[interview.type]}
                </p>
                <p className="mt-0.5 font-mono text-xs text-text-tertiary">
                  {formatDateTime(interview.scheduledAt)}
                  {interview.durationMinutes && ` · ${interview.durationMinutes}min`}
                </p>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', OUTCOME_STYLES[interview.outcome])}>
                {OUTCOME_LABELS[interview.outcome]}
              </span>
            </div>
            {(interview.interviewerName || interview.mode) && (
              <p className="mt-1.5 text-xs text-text-secondary">
                {[interview.interviewerName, interview.mode].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => onEdit(interview)}
                className="text-xs font-medium text-text-tertiary hover:text-text-primary"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(interview)}
                className="text-xs font-medium text-text-tertiary hover:text-status-rejected-text"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
