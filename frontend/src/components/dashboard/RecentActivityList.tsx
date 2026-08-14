import { Link } from 'react-router-dom';
import { DashboardStats } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { formatRelativeToToday } from '../../lib/utils';

export const RecentActivityList = ({ items }: { items: DashboardStats['recentActivity'] }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-panel)]">
        <EmptyState title="No activity yet" description="Updates to your applications will show up here." />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-[15px] font-semibold text-text-primary">Recent activity</h3>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="border-b border-border last:border-0">
            <Link
              to={`/applications/${item.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-canvas"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text-primary">{item.company}</p>
                <p className="truncate text-xs text-text-tertiary">{item.position}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[11px] text-text-tertiary">
                  {formatRelativeToToday(item.updatedAt)}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
