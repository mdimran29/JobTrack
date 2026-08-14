import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { jobMatchFormSchema, JobMatchFormValues } from '../../lib/schemas';

interface JobMatchFormProps {
  onSubmit: (values: JobMatchFormValues & { resumeFile?: File }) => void;
  isSubmitting: boolean;
}

export const JobMatchForm = ({ onSubmit, isSubmitting }: JobMatchFormProps) => {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobMatchFormValues>({
    resolver: zodResolver(jobMatchFormSchema),
    defaultValues: { companyName: '', jobTitle: '', jobDescription: '' },
  });

  const [resumeFile, setResumeFile] = useState<File | undefined>();

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        show('Clipboard is empty', 'error');
        return;
      }
      setValue('jobDescription', text, { shouldValidate: true, shouldDirty: true });
    } catch {
      show('Could not read clipboard — paste manually with Ctrl+V', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit((values) => onSubmit({ ...values, resumeFile }))} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="companyName" error={errors.companyName?.message} required>
          <Input id="companyName" placeholder="Coinbase" {...register('companyName')} />
        </Field>
        <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle?.message} required>
          <Input id="jobTitle" placeholder="Backend Engineer" {...register('jobTitle')} />
        </Field>
      </div>
      <Field label="Job description" htmlFor="jobDescription" error={errors.jobDescription?.message} required>
        <div className="mb-1.5 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handlePasteFromClipboard}>
            Paste from clipboard
          </Button>
        </div>
        <Textarea
          id="jobDescription"
          rows={10}
          placeholder="Paste the full job description…"
          {...register('jobDescription')}
        />
      </Field>
      <Field label="Resume" htmlFor="resumeFile" hint="Optional: PDF or TXT, up to 5 MB">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-control)] border border-dashed border-border-strong bg-canvas px-4 py-3 transition hover:border-accent-500">
          <span className="min-w-0 truncate text-[13px] text-text-secondary">
            {resumeFile ? resumeFile.name : 'Choose your resume file'}
          </span>
          <span className="shrink-0 rounded-md bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-primary shadow-sm">
            Browse
          </span>
          <input
            id="resumeFile"
            type="file"
            accept="application/pdf,.pdf,text/plain,.txt"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && file.size <= 5 * 1024 * 1024 && (file.type === 'application/pdf' || file.type === 'text/plain' || /\.(pdf|txt)$/i.test(file.name))) {
                setResumeFile(file);
              } else {
                setResumeFile(undefined);
                show('Choose a PDF or TXT resume smaller than 5 MB', 'error');
                event.target.value = '';
              }
            }}
          />
        </label>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Analyze Job
        </Button>
      </div>
    </form>
  );
};
