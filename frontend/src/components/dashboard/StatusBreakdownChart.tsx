import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ApplicationStatus, APPLICATION_STATUSES } from '../../types';
import { STATUS_LABELS } from '../../lib/utils';

const BAR_COLOR: Record<ApplicationStatus, string> = {
  APPLIED: 'var(--color-status-applied-text)',
  SCREENING: 'var(--color-status-screening-text)',
  INTERVIEW: 'var(--color-status-interview-text)',
  TECHNICAL: 'var(--color-status-technical-text)',
  OFFER: 'var(--color-status-offer-text)',
  REJECTED: 'var(--color-status-rejected-text)',
  WITHDRAWN: 'var(--color-status-withdrawn-text)',
};

interface StatusBreakdownChartProps {
  byStatus: Record<ApplicationStatus, number>;
}

export const StatusBreakdownChart = ({ byStatus }: StatusBreakdownChartProps) => {
  const data = APPLICATION_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: byStatus[status] ?? 0,
  }));

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-panel)]">
      <h3 className="mb-4 font-display text-[15px] font-semibold text-text-primary">Status breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={78}
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-canvas)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                boxShadow: 'var(--shadow-popover)',
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={BAR_COLOR[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
