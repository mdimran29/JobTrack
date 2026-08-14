import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { noteSchema, NoteFormValues } from '../../lib/schemas';

interface NoteFormProps {
  initialContent?: string;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export const NoteForm = ({ initialContent, onSubmit, onCancel, isSubmitting, submitLabel }: NoteFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: initialContent ?? '' },
  });

  const submit = async (values: NoteFormValues) => {
    await onSubmit(values);
    if (!initialContent) reset({ content: '' });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-2">
      <Textarea
        rows={3}
        placeholder="Add a note about this application…"
        error={errors.content?.message}
        {...register('content')}
      />
      {errors.content && <span className="text-xs text-danger">{errors.content.message}</span>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {submitLabel ?? 'Add note'}
        </Button>
      </div>
    </form>
  );
};
