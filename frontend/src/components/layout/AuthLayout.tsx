import { ReactNode } from 'react';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-12">
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)',
      }}
    />
    <div
      className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl"
      style={{ background: 'radial-gradient(closest-side, #c8862a, transparent)' }}
    />

    <div className="relative w-full max-w-sm">
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-500 text-ink-950">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

      <div className="rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-7 shadow-[var(--shadow-popover)]">
        {children}
      </div>
    </div>
  </div>
);
