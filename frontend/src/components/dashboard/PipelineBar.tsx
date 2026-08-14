import { PIPELINE_STAGES, ApplicationStatus } from '../../types';
import { STATUS_LABELS } from '../../lib/utils';

const STAGE_BAR_COLOR: Record<ApplicationStatus, string> = {
  APPLIED: 'var(--color-status-applied-text)',
  SCREENING: 'var(--color-status-screening-text)',
  INTERVIEW: 'var(--color-status-interview-text)',
  TECHNICAL: 'var(--color-status-technical-text)',
  OFFER: 'var(--color-status-offer-text)',
  REJECTED: 'var(--color-status-rejected-text)',
  WITHDRAWN: 'var(--color-status-withdrawn-text)',
};

interface PipelineBarProps {
  byStatus: Record<ApplicationStatus, number>;
}

export const PipelineBar = ({ byStatus }: PipelineBarProps) => {
  const counts = PIPELINE_STAGES.map((stage) => byStatus[stage] ?? 0);
  const max = Math.max(...counts, 1);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-panel)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-[15px] font-semibold text-text-primary">Pipeline</h3>
        <p className="text-xs text-text-tertiary">Where your open applications stand right now</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PIPELINE_STAGES.map((stage, i) => {
          const count = counts[i];
          const heightPct = Math.max((count / max) * 100, count > 0 ? 10 : 3);
          return (
            <div key={stage} className="relative">
              {i < PIPELINE_STAGES.length - 1 && (
                <svg
                  className="pointer-events-none absolute top-6 -right-2.5 hidden sm:block"
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="none"
                >
                  <path d="M1 1l4 5-4 5" stroke="var(--color-border-strong)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                {STATUS_LABELS[stage]}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text-primary">
                {count}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${heightPct}%`, backgroundColor: STAGE_BAR_COLOR[stage] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
