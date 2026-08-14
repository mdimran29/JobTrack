import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { applicationSchema, ApplicationFormValues } from '../../lib/schemas';
import { APPLICATION_STATUSES, JobApplication } from '../../types';
import { STATUS_LABELS } from '../../lib/utils';

interface ApplicationFormProps {
  initialValues?: JobApplication;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export const ApplicationForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: ApplicationFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company: initialValues?.company ?? '',
      position: initialValues?.position ?? '',
      status: initialValues?.status ?? 'APPLIED',
      appliedDate: toDateInput(initialValues?.appliedDate) || toDateInput(new Date().toISOString()),
      location: initialValues?.location ?? '',
      jobUrl: initialValues?.jobUrl ?? '',
      source: initialValues?.source ?? '',
      salaryMin: initialValues?.salaryMin ?? undefined,
      salaryMax: initialValues?.salaryMax ?? undefined,
      followUpDate: toDateInput(initialValues?.followUpDate),
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        company: initialValues.company,
        position: initialValues.position,
        status: initialValues.status,
        appliedDate: toDateInput(initialValues.appliedDate),
        location: initialValues.location ?? '',
        jobUrl: initialValues.jobUrl ?? '',
        source: initialValues.source ?? '',
        salaryMin: initialValues.salaryMin ?? undefined,
        salaryMax: initialValues.salaryMax ?? undefined,
        followUpDate: toDateInput(initialValues.followUpDate),
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="company" error={errors.company?.message} required>
          <Input id="company" placeholder="Acme Corp" {...register('company')} />
        </Field>
        <Field label="Role" htmlFor="position" error={errors.position?.message} required>
          <Input id="position" placeholder="Senior Engineer" {...register('position')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register('status')}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Applied on" htmlFor="appliedDate" error={errors.appliedDate?.message} required>
          <Input id="appliedDate" type="date" {...register('appliedDate')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={errors.location?.message} hint="Optional">
          <Input id="location" placeholder="Remote" {...register('location')} />
        </Field>
        <Field label="Source" htmlFor="source" error={errors.source?.message} hint="Optional">
          <Input id="source" placeholder="LinkedIn, referral…" {...register('source')} />
        </Field>
      </div>

      <Field label="Job posting URL" htmlFor="jobUrl" error={errors.jobUrl?.message} hint="Optional">
        <Input id="jobUrl" placeholder="https://…" {...register('jobUrl')} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Salary min" htmlFor="salaryMin" error={errors.salaryMin?.message} hint="Optional">
          <Input id="salaryMin" type="number" placeholder="120000" {...register('salaryMin')} />
        </Field>
        <Field label="Salary max" htmlFor="salaryMax" error={errors.salaryMax?.message} hint="Optional">
          <Input id="salaryMax" type="number" placeholder="150000" {...register('salaryMax')} />
        </Field>
        <Field label="Follow up on" htmlFor="followUpDate" error={errors.followUpDate?.message} hint="Optional">
          <Input id="followUpDate" type="date" {...register('followUpDate')} />
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
          {initialValues ? 'Save changes' : 'Add application'}
        </Button>
      </div>
    </form>
  );
};
