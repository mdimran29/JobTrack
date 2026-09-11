import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials, cn } from '../../lib/utils';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="2" width="6" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="7.5" width="6" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="9.5" width="6" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: '/applications',
    label: 'Applications',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect x="2" y="4.5" width="13" height="9.5" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 4.5V3.6A1.6 1.6 0 017.6 2h1.8A1.6 1.6 0 0111 3.6v.9" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 8.5h13" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: '/follow-ups',
    label: 'Follow-ups',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="8.5" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.5 6v3.2l2.2 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6.2 2.3h4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/job-match',
    label: 'Job Match',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="8.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/job-search',
    label: 'Job Search',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="7.3" cy="7.3" r="4.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="m10.5 10.5 3.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/resumes',
    label: 'Resumes',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M4 2.5h6.2L13 5.3v9.2H4V2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M10 2.5v3h3M6.5 8h4M6.5 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-60 flex-col bg-ink-950 text-ink-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-500 text-ink-950">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="font-display text-[15px] font-semibold text-text-inverse">JobTrack</span>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-ink-800 text-text-inverse'
                  : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 font-mono text-[11px] font-medium text-ink-200">
            {user ? initials(user.name) : ''}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-text-inverse">{user?.name}</p>
            <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M6 2H3.5A1.5 1.5 0 002 3.5v8A1.5 1.5 0 003.5 13H6M10 10.5L13 7.5M13 7.5L10 4.5M13 7.5H6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
