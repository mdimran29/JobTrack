import { Link } from 'react-router-dom';
import { JobApplication } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDate, formatSalary } from '../../lib/utils';

interface ApplicationTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}

const RowActions = ({
  application,
  onEdit,
  onDelete,
}: {
  application: JobApplication;
  onEdit: (a: JobApplication) => void;
  onDelete: (a: JobApplication) => void;
}) => (
  <div className="flex items-center justify-end gap-1">
    <button
      onClick={(e) => {
        e.preventDefault();
        onEdit(application);
      }}
      aria-label={`Edit ${application.company}`}
      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-canvas hover:text-text-primary"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
          d="M10.5 2.5l2 2L5 12H3v-2l7.5-7.5z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
    <button
      onClick={(e) => {
        e.preventDefault();
        onDelete(application);
      }}
      aria-label={`Delete ${application.company}`}
      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-status-rejected-bg hover:text-status-rejected-text"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
          d="M3 4.5h9M6 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M5 4.5v7a1 1 0 001 1h3a1 1 0 001-1v-7"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
);

export const ApplicationTable = ({ applications, onEdit, onDelete }: ApplicationTableProps) => (
  <>
    {/* Mobile card list */}
    <ul className="flex flex-col gap-2 sm:hidden">
      {applications.map((app) => (
        <li key={app.id}>
          <Link
            to={`/applications/${app.id}`}
            className="block rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{app.company}</p>
                <p className="truncate text-xs text-text-secondary">{app.position}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[11px] text-text-tertiary">
                Applied {formatDate(app.appliedDate)}
              </span>
              <RowActions application={app} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </Link>
        </li>
      ))}
    </ul>

    {/* Desktop table */}
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Role</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Applied</th>
            <th className="px-3 py-3 font-medium">Salary</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="group border-b border-border last:border-0 hover:bg-canvas">
              <td className="px-5 py-3">
                <Link to={`/applications/${app.id}`} className="font-medium text-text-primary hover:text-accent-600">
                  {app.company}
                </Link>
              </td>
              <td className="px-3 py-3 text-text-secondary">{app.position}</td>
              <td className="px-3 py-3">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-3 py-3 font-mono text-xs text-text-tertiary">{formatDate(app.appliedDate)}</td>
              <td className="px-3 py-3 font-mono text-xs text-text-tertiary">
                {formatSalary(app.salaryMin, app.salaryMax) ?? '—'}
              </td>
              <td className="px-3 py-3">
                <RowActions application={app} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);
