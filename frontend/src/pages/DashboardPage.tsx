import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { PipelineBar } from '../components/dashboard/PipelineBar';
import { StatusBreakdownChart } from '../components/dashboard/StatusBreakdownChart';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatPercent } from '../lib/utils';
import { getErrorMessage } from '../api/axios';

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-[var(--radius-card)] bg-border/60" />
      ))}
    </div>
    <div className="h-40 rounded-[var(--radius-card)] bg-border/60" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-[var(--radius-card)] bg-border/60" />
      <div className="h-72 rounded-[var(--radius-card)] bg-border/60" />
    </div>
  </div>
);

export const DashboardPage = () => {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your job search, at a glance."
        action={
          <Link to="/job-search">
            <Button size="sm" variant="secondary">Search jobs</Button>
          </Link>
        }
      />

      {isLoading && <DashboardSkeleton />}

      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {data && data.totalApplications === 0 && (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="font-display text-[17px] font-semibold text-text-primary">Nothing tracked yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-text-secondary">
            Add your first application and this page turns into your pipeline, interview rate, and
            offer rate at a glance.
          </p>
          <Link to="/applications">
            <Button size="sm" className="mt-5">
              Add application
            </Button>
          </Link>
        </div>
      )}

      {data && data.totalApplications > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total applications" value={data.totalApplications} />
            <StatCard
              label="Interview rate"
              value={formatPercent(data.interviewRate)}
              hint="Reached at least one interview"
              accent
            />
            <StatCard
              label="Offer rate"
              value={formatPercent(data.offerRate)}
              hint="Of all applications"
              accent
            />
            <StatCard
              label="Active pipeline"
              value={
                data.totalApplications -
                (data.byStatus.REJECTED ?? 0) -
                (data.byStatus.WITHDRAWN ?? 0)
              }
              hint="Still in motion"
            />
          </div>

          <PipelineBar byStatus={data.byStatus} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatusBreakdownChart byStatus={data.byStatus} />
            <RecentActivityList items={data.recentActivity} />
          </div>
        </div>
      )}
    </div>
  );
};
