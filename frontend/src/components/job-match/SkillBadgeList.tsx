import { cn } from '../../lib/utils';

interface SkillBadgeListProps {
  title: string;
  skills: string[];
  variant: 'matched' | 'missing';
  emptyMessage?: string;
}

export const SkillBadgeList = ({ title, skills, variant, emptyMessage }: SkillBadgeListProps) => (
  <div>
    <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
    {skills.length === 0 ? (
      <p className="text-[13px] text-text-tertiary">{emptyMessage ?? 'None'}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              variant === 'matched'
                ? 'bg-score-excellent-bg text-score-excellent-text'
                : 'bg-score-weak-bg text-score-weak-text'
            )}
          >
            {variant === 'matched' ? '✓' : '⚠'} {skill}
          </span>
        ))}
      </div>
    )}
  </div>
);
