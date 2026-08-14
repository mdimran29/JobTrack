import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { interviewSchema, InterviewFormValues } from '../../lib/schemas';
import { INTERVIEW_OUTCOMES, INTERVIEW_TYPES, Interview } from '../../types';
import { INTERVIEW_TYPE_LABELS } from '../../lib/utils';

const toDateTimeLocal = (value?: string) => (value ? value.slice(0, 16) : '');

const OUTCOME_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Not selected',
  CANCELLED: 'Cancelled',
};

interface InterviewFormProps {
  initialValues?: Interview;
  onSubmit: (values: InterviewFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

export const InterviewForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: InterviewFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      type: initialValues?.type ?? 'PHONE_SCREEN',
      scheduledAt: toDateTimeLocal(initialValues?.scheduledAt),
      durationMinutes: initialValues?.durationMinutes ?? undefined,
      interviewerName: initialValues?.interviewerName ?? '',
      mode: initialValues?.mode ?? '',
      outcome: initialValues?.outcome ?? 'PENDING',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="type" error={errors.type?.message}>
          <Select id="type" {...register('type')}>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERVIEW_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date & time" htmlFor="scheduledAt" error={errors.scheduledAt?.message} required>
          <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Interviewer" htmlFor="interviewerName" error={errors.interviewerName?.message} hint="Optional">
          <Input id="interviewerName" placeholder="Jane Doe" {...register('interviewerName')} />
        </Field>
        <Field label="Mode" htmlFor="mode" error={errors.mode?.message} hint="Optional">
          <Input id="mode" placeholder="Remote, onsite…" {...register('mode')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Duration (min)" htmlFor="durationMinutes" error={errors.durationMinutes?.message} hint="Optional">
          <Input id="durationMinutes" type="number" placeholder="45" {...register('durationMinutes')} />
        </Field>
        <Field label="Outcome" htmlFor="outcome" error={errors.outcome?.message}>
          <Select id="outcome" {...register('outcome')}>
            {INTERVIEW_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {OUTCOME_LABELS[o]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {submitError && (
        <div className="rounded-[var(--radius-control)] border border-status-rejected-bg bg-status-rejected-bg px-3 py-2 text-[13px] text-status-rejected-text">
          {submitError}
        </div>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? 'Save changes' : 'Add interview'}
        </Button>
      </div>
    </form>
  );
};
