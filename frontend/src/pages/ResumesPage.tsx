import { FormEvent, useState } from 'react';
import { format } from 'date-fns';
import { getErrorMessage } from '../api/axios';
import { ResumeVersion } from '../api/resumes.api';
import { useCreateResume, useDeleteResume, useResumeMatches, useResumes, useUpdateResume } from '../hooks/useResumes';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

const dateLabel = (value: string) => format(new Date(value), 'MMM d, yyyy');

export const ResumesPage = () => {
  const resumes = useResumes();
  const matches = useResumeMatches();
  const create = useCreateResume();
  const update = useUpdateResume();
  const remove = useDeleteResume();
  const [editing, setEditing] = useState<ResumeVersion | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const reset = () => {
    setEditing(null);
    setName('');
    setContent('');
  };

  const startEdit = (resume: ResumeVersion) => {
    setEditing(resume);
    setName(resume.name);
    setContent(resume.content);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !content.trim()) return;
    if (editing) {
      update.mutate({ id: editing.id, input: { name: name.trim(), content: content.trim() } }, { onSuccess: reset });
    } else {
      create.mutate({ name: name.trim(), content: content.trim() }, { onSuccess: reset });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <div>
      <PageHeader title="Resumes" description="Keep focused versions of your resume ready for job matching." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader><CardTitle>{editing ? 'Edit version' : 'Add a version'}</CardTitle></CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={submit}>
              <label className="block space-y-1.5 text-[13px] font-medium text-text-primary">
                Version name
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Frontend engineer" maxLength={200} />
              </label>
              <label className="block space-y-1.5 text-[13px] font-medium text-text-primary">
                Resume text
                <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the resume content here..." rows={12} />
              </label>
              {(create.isError || update.isError) && <p className="text-[13px] text-danger">{getErrorMessage(create.error ?? update.error, 'Could not save this version')}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={isSaving}>{editing ? 'Save changes' : 'Save version'}</Button>
                {editing && <Button type="button" size="sm" variant="ghost" onClick={reset}>Cancel</Button>}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Saved versions</CardTitle><span className="text-[12px] text-text-tertiary">{resumes.data?.length ?? 0} total</span></CardHeader>
          {resumes.isError ? <ErrorState message={getErrorMessage(resumes.error)} onRetry={() => resumes.refetch()} /> :
            resumes.data?.length ? <div className="divide-y divide-border">
              {resumes.data.map((resume) => <div key={resume.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0"><p className="truncate text-[13px] font-medium text-text-primary">{resume.name}</p><p className="mt-1 text-[12px] text-text-tertiary">Updated {dateLabel(resume.updatedAt)} · {resume.content.length.toLocaleString()} characters</p></div>
                <div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" onClick={() => startEdit(resume)}>Edit</Button><Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => remove.mutate(resume.id)} disabled={remove.isPending}>Delete</Button></div>
              </div>)}
            </div> : <EmptyState title="No saved versions" description="Add a version to reuse resume content in your workflow." />}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Match history</CardTitle><span className="text-[12px] text-text-tertiary">Recent analyses</span></CardHeader>
        {matches.isError ? <ErrorState message={getErrorMessage(matches.error)} onRetry={() => matches.refetch()} /> :
          matches.data?.length ? <div className="divide-y divide-border">
            {matches.data.map((match) => {
              const score = typeof match.result.overallScore === 'number' ? match.result.overallScore : null;
              return <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div><p className="text-[13px] font-medium text-text-primary">{match.jobTitle} <span className="font-normal text-text-secondary">at {match.companyName}</span></p><p className="mt-1 text-[12px] text-text-tertiary">{match.resumeVersion?.name ?? 'No saved version'} · {dateLabel(match.createdAt)}</p></div>{score !== null && <span className="font-display text-sm font-semibold text-accent-700">{score}% match</span>}</div>;
            })}
          </div> : <EmptyState title="No match history" description="Analyses linked to saved resume versions will appear here." />}
      </Card>
    </div>
  );
};
