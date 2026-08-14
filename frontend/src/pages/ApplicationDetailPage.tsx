import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PipelineStageIndicator } from '../components/applications/PipelineStageIndicator';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { InterviewTimeline } from '../components/interviews/InterviewTimeline';
import { InterviewForm } from '../components/interviews/InterviewForm';
import { NoteForm } from '../components/notes/NoteForm';
import { NoteList } from '../components/notes/NoteList';
import { useToast } from '../components/ui/Toast';
import { getErrorMessage } from '../api/axios';
import { useApplication, useDeleteApplication, useUpdateApplication } from '../hooks/useApplications';
import { useCreateInterview, useDeleteInterview, useUpdateInterview } from '../hooks/useInterviews';
import { useCreateNote, useDeleteNote, useUpdateNote } from '../hooks/useNotes';
import { formatDate, formatSalary } from '../lib/utils';
import { Interview } from '../types';

export const ApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();

  const { data: application, isLoading, isError, error, refetch } = useApplication(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);

  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [deletingInterview, setDeletingInterview] = useState<Interview | null>(null);
  const [interviewSubmitError, setInterviewSubmitError] = useState<string | null>(null);

  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();
  const createInterview = useCreateInterview(id ?? '');
  const updateInterview = useUpdateInterview(id ?? '');
  const deleteInterview = useDeleteInterview(id ?? '');
  const createNote = useCreateNote(id ?? '');
  const updateNote = useUpdateNote(id ?? '');
  const deleteNote = useDeleteNote(id ?? '');

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !application) {
    return <ErrorState message={getErrorMessage(error, 'Application not found')} onRetry={() => refetch()} />;
  }

  const salary = formatSalary(application.salaryMin, application.salaryMax);

  return (
    <div>
      <Link to="/applications" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Applications
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">{application.company}</h1>
          <p className="mt-1 text-sm text-text-secondary">{application.position}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <PipelineStageIndicator status={application.status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingInterview(null);
                  setInterviewSubmitError(null);
                  setInterviewFormOpen(true);
                }}
              >
                Add interview
              </Button>
            </CardHeader>
            <CardBody>
              <InterviewTimeline
                interviews={application.interviews}
                onEdit={(interview) => {
                  setEditingInterview(interview);
                  setInterviewSubmitError(null);
                  setInterviewFormOpen(true);
                }}
                onDelete={setDeletingInterview}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <NoteForm
                isSubmitting={createNote.isPending}
                onSubmit={async (values) => {
                  try {
                    await createNote.mutateAsync(values.content);
                  } catch (err) {
                    show(getErrorMessage(err, 'Could not add note'), 'error');
                  }
                }}
              />
              <NoteList
                notes={application.notes}
                isUpdating={updateNote.isPending}
                onUpdate={async (noteId, content) => {
                  try {
                    await updateNote.mutateAsync({ id: noteId, content });
                  } catch (err) {
                    show(getErrorMessage(err, 'Could not update note'), 'error');
                  }
                }}
                onDelete={async (noteId) => {
                  try {
                    await deleteNote.mutateAsync(noteId);
                    show('Note deleted');
                  } catch (err) {
                    show(getErrorMessage(err, 'Could not delete note'), 'error');
                  }
                }}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <StatusBadge status={application.status} />
            </CardHeader>
            <CardBody className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary">Applied</span>
                <span className="font-mono text-text-primary">{formatDate(application.appliedDate)}</span>
              </div>
              {application.location && (
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Location</span>
                  <span className="text-text-primary">{application.location}</span>
                </div>
              )}
              {application.source && (
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Source</span>
                  <span className="text-text-primary">{application.source}</span>
                </div>
              )}
              {salary && (
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Salary</span>
                  <span className="font-mono text-text-primary">{salary}</span>
                </div>
              )}
              {application.followUpDate && (
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Follow up</span>
                  <span className="font-mono text-text-primary">{formatDate(application.followUpDate)}</span>
                </div>
              )}
              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-accent-600 hover:text-accent-700"
                >
                  View posting
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3.5 8.5l5-5M8.5 3.5h-4M8.5 3.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit application" width="lg">
        <ApplicationForm
          initialValues={application}
          isSubmitting={updateApplication.isPending}
          submitError={editSubmitError}
          onCancel={() => setEditOpen(false)}
          onSubmit={async (values) => {
            setEditSubmitError(null);
            try {
              await updateApplication.mutateAsync({
                id: application.id,
                input: {
                  ...values,
                  location: values.location || undefined,
                  jobUrl: values.jobUrl || undefined,
                  source: values.source || undefined,
                  followUpDate: values.followUpDate || undefined,
                  salaryMin: Number.isNaN(values.salaryMin) ? undefined : values.salaryMin,
                  salaryMax: Number.isNaN(values.salaryMax) ? undefined : values.salaryMax,
                },
              });
              show('Application updated');
              setEditOpen(false);
            } catch (err) {
              setEditSubmitError(getErrorMessage(err, 'Could not save changes'));
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete application?"
        description={`This removes ${application.company} — ${application.position} along with its interviews and notes. This can't be undone.`}
        isLoading={deleteApplication.isPending}
        onConfirm={async () => {
          try {
            await deleteApplication.mutateAsync(application.id);
            show('Application deleted');
            navigate('/applications');
          } catch (err) {
            show(getErrorMessage(err, 'Could not delete this application'), 'error');
          }
        }}
        onCancel={() => setDeleteOpen(false)}
      />

      <Modal
        open={interviewFormOpen}
        onClose={() => setInterviewFormOpen(false)}
        title={editingInterview ? 'Edit interview' : 'Add interview'}
        width="lg"
      >
        <InterviewForm
          initialValues={editingInterview ?? undefined}
          isSubmitting={createInterview.isPending || updateInterview.isPending}
          submitError={interviewSubmitError}
          onCancel={() => setInterviewFormOpen(false)}
          onSubmit={async (values) => {
            setInterviewSubmitError(null);
            const payload = {
              ...values,
              interviewerName: values.interviewerName || undefined,
              mode: values.mode || undefined,
              durationMinutes: Number.isNaN(values.durationMinutes) ? undefined : values.durationMinutes,
            };
            try {
              if (editingInterview) {
                await updateInterview.mutateAsync({ id: editingInterview.id, input: payload });
                show('Interview updated');
              } else {
                await createInterview.mutateAsync(payload);
                show('Interview added');
              }
              setInterviewFormOpen(false);
            } catch (err) {
              setInterviewSubmitError(getErrorMessage(err, 'Could not save this interview'));
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingInterview)}
        title="Delete interview?"
        description="This can't be undone."
        isLoading={deleteInterview.isPending}
        onConfirm={async () => {
          if (!deletingInterview) return;
          try {
            await deleteInterview.mutateAsync(deletingInterview.id);
            show('Interview deleted');
            setDeletingInterview(null);
          } catch (err) {
            show(getErrorMessage(err, 'Could not delete this interview'), 'error');
          }
        }}
        onCancel={() => setDeletingInterview(null)}
      />
    </div>
  );
};
