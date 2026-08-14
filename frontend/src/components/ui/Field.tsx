import { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, error, hint, required, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-text-secondary">
      {label}
      {required && <span className="ml-0.5 text-accent-600">*</span>}
    </label>
    {children}
    {error ? (
      <span className="text-xs text-danger">{error}</span>
    ) : hint ? (
      <span className="text-xs text-text-tertiary">{hint}</span>
    ) : null}
  </div>
);
