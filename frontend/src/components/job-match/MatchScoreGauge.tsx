import { cn, scoreBand, ScoreBand } from '../../lib/utils';

const RING_COLORS: Record<ScoreBand, string> = {
  excellent: 'stroke-score-excellent-text',
  strong: 'stroke-score-strong-text',
  moderate: 'stroke-score-moderate-text',
  weak: 'stroke-score-weak-text',
  poor: 'stroke-score-poor-text',
};

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const MatchScoreGauge = ({ score }: { score: number }) => {
  const band = scoreBand(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', RING_COLORS[band])}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-[40px] font-semibold leading-none tabular-nums text-text-primary">
          {score}%
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          Match score
        </span>
      </div>
    </div>
  );
};
