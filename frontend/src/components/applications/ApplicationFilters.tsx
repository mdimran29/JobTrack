import { useEffect, useState } from 'react';
import { Select } from '../ui/Select';
import { ApplicationStatus, APPLICATION_STATUSES } from '../../types';
import { STATUS_LABELS } from '../../lib/utils';

interface ApplicationFiltersProps {
  search: string;
  status: ApplicationStatus | '';
  sortBy: string;
  order: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ApplicationStatus | '') => void;
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
}

export const ApplicationFilters = ({
  search,
  status,
  sortBy,
  order,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: ApplicationFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search company or role…"
          className="h-9 w-full rounded-[var(--radius-control)] border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:border-accent-500"
        />
      </div>

      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ApplicationStatus | '')}
        className="w-full sm:w-40"
      >
        <option value="">All statuses</option>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select
        value={`${sortBy}:${order}`}
        onChange={(e) => {
          const [nextSortBy, nextOrder] = e.target.value.split(':');
          onSortChange(nextSortBy, nextOrder as 'asc' | 'desc');
        }}
        className="w-full sm:w-48"
      >
        <option value="appliedDate:desc">Applied date (newest)</option>
        <option value="appliedDate:asc">Applied date (oldest)</option>
        <option value="company:asc">Company (A–Z)</option>
        <option value="company:desc">Company (Z–A)</option>
        <option value="updatedAt:desc">Recently updated</option>
      </Select>
    </div>
  );
};
