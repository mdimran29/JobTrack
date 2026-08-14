import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFollowUps } from '../hooks/useApplications';
import { getErrorMessage } from '../api/axios';
import { formatDate, formatRelativeToToday } from '../lib/utils';

const ListSkeleton = () => (
  <div className="animate-pulse divide-y divide-border">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-4 w-40 rounded bg-border" />
        <div className="h-4 w-24 rounded bg-border" />
      </div>
    ))}
  </div>
);

export const FollowUpsPage = () => {
  const { data, isLoading, isError, error, refetch } = useFollowUps();

  const overdue = (data ?? []).filter((app) => new Date(app.followUpDate as string) < new Date(new Date().setHours(0, 0, 0, 0)));
  const dueToday = (data ?? []).filter((app) => {
    const d = new Date(app.followUpDate as string);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Applications waiting on a nudge from you."
      />

      <Card className="overflow-hidden">
        {isLoading && <ListSkeleton />}

        {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {data && data.length === 0 && (
          <EmptyState
            title="Nothing due"
            description="You're all caught up. Follow-up dates you set on applications will surface here once they're due."
          />
        )}

        {data && data.length > 0 && (
          <ul>
            {data.map((app) => {
              const isOverdue = overdue.some((a) => a.id === app.id);
              const isToday = dueToday.some((a) => a.id === app.id);
              return (
                <li key={app.id} className="border-b border-border last:border-0">
                  <Link
                    to={`/applications/${app.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-canvas"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-text-primary">{app.company}</p>
                      <p className="truncate text-xs text-text-secondary">{app.position}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          isOverdue
                            ? 'font-mono text-xs font-medium text-status-rejected-text'
                            : isToday
                              ? 'font-mono text-xs font-medium text-accent-600'
                              : 'font-mono text-xs text-text-tertiary'
                        }
                      >
                        {formatRelativeToToday(app.followUpDate as string)} · {formatDate(app.followUpDate as string)}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};
