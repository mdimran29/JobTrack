import { cn, scoreBand, ScoreBand } from '../../lib/utils';

const BAND_STYLES: Record<ScoreBand, string> = {
  excellent: 'bg-score-excellent-bg text-score-excellent-text',
  strong: 'bg-score-strong-bg text-score-strong-text',
  moderate: 'bg-score-moderate-bg text-score-moderate-text',
  weak: 'bg-score-weak-bg text-score-weak-text',
  poor: 'bg-score-poor-bg text-score-poor-text',
};

interface RecommendationCardProps {
  recommendation: string;
  overallScore: number;
}

export const RecommendationCard = ({ recommendation, overallScore }: RecommendationCardProps) => {
  const band = scoreBand(overallScore);
  return (
    <div
      className={cn(
        'w-full rounded-[var(--radius-card)] border border-border px-5 py-4 text-center',
        BAND_STYLES[band]
      )}
    >
      <p className="text-[12px] font-medium uppercase tracking-wide opacity-80">Recommendation</p>
      <p className="mt-1 font-display text-xl font-semibold">{recommendation}</p>
    </div>
  );
};
