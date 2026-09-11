import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ApplicationFilters } from '../components/applications/ApplicationFilters';
import { ApplicationTable } from '../components/applications/ApplicationTable';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import {
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
} from '../hooks/useApplications';
import { useToast } from '../components/ui/Toast';
import { getErrorMessage } from '../api/axios';
import { ApplicationFormValues } from '../lib/schemas';
import { ApplicationStatus, JobApplication } from '../types';

const TableSkeleton = () => (
  <div className="animate-pulse divide-y divide-border">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-4 w-32 rounded bg-border" />
        <div className="h-4 w-40 rounded bg-border" />
        <div className="h-5 w-20 rounded-full bg-border" />
      </div>
    ))}
  </div>
);

export const ApplicationsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [sortBy, setSortBy] = useState('appliedDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [deletingApplication, setDeletingApplication] = useState<JobApplication | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { show } = useToast();

  const { data, isLoading, isError, error, refetch } = useApplications({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    sortBy: sortBy as never,
    order,
  });

  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();

  const openCreateForm = () => {
    setEditingApplication(null);
    setSubmitError(null);
    setFormOpen(true);
  };

  const openEditForm = (application: JobApplication) => {
    setEditingApplication(application);
    setSubmitError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ApplicationFormValues) => {
    setSubmitError(null);
    // On edit, send null for emptied fields so the server clears them; on create, omit them.
    const empty = editingApplication ? null : undefined;
    const payload = {
      ...values,
      location: values.location || empty,
      jobUrl: values.jobUrl || empty,
      source: values.source || empty,
      followUpDate: values.followUpDate || empty,
      salaryMin: values.salaryMin === undefined || Number.isNaN(values.salaryMin) ? empty : values.salaryMin,
      salaryMax: values.salaryMax === undefined || Number.isNaN(values.salaryMax) ? empty : values.salaryMax,
    };

    try {
      if (editingApplication) {
        await updateMutation.mutateAsync({ id: editingApplication.id, input: payload });
        show('Application updated');
      } else {
        await createMutation.mutateAsync(payload);
        show('Application added');
      }
      setFormOpen(false);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not save this application'));
    }
  };

  const handleDelete = async () => {
    if (!deletingApplication) return;
    try {
      await deleteMutation.mutateAsync(deletingApplication.id);
      show('Application deleted');
      setDeletingApplication(null);
    } catch (err) {
      show(getErrorMessage(err, 'Could not delete this application'), 'error');
    }
  };

  const hasFilters = Boolean(search || status);

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Every role you've applied to, in one place."
        action={<Button onClick={openCreateForm}>Add application</Button>}
      />

      <div className="mb-4">
        <ApplicationFilters
          search={search}
          status={status}
          sortBy={sortBy}
          order={order}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onStatusChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          onSortChange={(nextSortBy, nextOrder) => {
            setSortBy(nextSortBy);
            setOrder(nextOrder);
          }}
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading && <TableSkeleton />}

        {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {data && data.data.length === 0 && (
          <EmptyState
            title={hasFilters ? 'No matches' : 'No applications yet'}
            description={
              hasFilters
                ? 'Try a different search term or clear your filters.'
                : 'Add your first application to start tracking your search.'
            }
            action={
              !hasFilters && (
                <Button size="sm" onClick={openCreateForm}>
                  Add application
                </Button>
              )
            }
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <ApplicationTable applications={data.data} onEdit={openEditForm} onDelete={setDeletingApplication} />
            <div className="border-t border-border">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingApplication ? 'Edit application' : 'Add application'}
        width="lg"
      >
        <ApplicationForm
          initialValues={editingApplication ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitError={submitError}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingApplication)}
        title="Delete application?"
        description={
          deletingApplication
            ? `This removes ${deletingApplication.company} — ${deletingApplication.position} along with its interviews and notes. This can't be undone.`
            : ''
        }
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingApplication(null)}
      />
    </div>
  );
};
