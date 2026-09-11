import { FormEvent, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { useJobSearch } from '../hooks/useJobSearch';
import { JobSearchParams, JobSearchResult } from '../api/job-search.api';
import { useCreateApplication } from '../hooks/useApplications';
import { useToast } from '../components/ui/Toast';
import { getErrorMessage } from '../api/axios';
import { formatSalary } from '../lib/utils';

export const JobSearchPage = () => {
  const { show } = useToast();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState<JobSearchParams | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const { data, isLoading, isError, error, refetch } = useJobSearch(submitted);
  const createApplication = useCreateApplication();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    setSubmitted({ keyword: keyword.trim(), location: location.trim() || undefined, page: 1, limit: 20 });
  };

  const saveJob = async (job: JobSearchResult) => {
    try {
      await createApplication.mutateAsync({
        company: job.company,
        position: job.title,
        status: 'APPLIED',
        appliedDate: new Date().toISOString().slice(0, 10),
        jobUrl: job.url || undefined,
        location: job.location,
        source: 'Adzuna job search',
      });
      setSavedIds((current) => new Set(current).add(job.id));
      show('Job added to applications');
    } catch (saveError) {
      show(getErrorMessage(saveError, 'Could not add this job'), 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Job Search" description="Find roles and add promising opportunities to your application tracker." />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Job title, skill, or keyword" aria-label="Job keyword" />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Indian city or remote" aria-label="Indian job location" />
            <Button type="submit" isLoading={isLoading}>Search jobs</Button>
          </form>
        </CardBody>
      </Card>

      {isLoading && <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>}
      {isError && <ErrorState message={getErrorMessage(error, 'Job search failed')} onRetry={() => refetch()} />}

      {!isLoading && !isError && submitted && data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[13px] text-text-secondary">
            <span>{data.meta.total.toLocaleString()} results for “{submitted.keyword}”</span>
            <span>Powered by Adzuna</span>
          </div>
          {data.data.map((job) => {
            const saved = savedIds.has(job.id);
            const salary = formatSalary(job.salaryMin, job.salaryMax);
            return (
              <Card key={job.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="font-display text-[16px] font-semibold text-text-primary">{job.title}</h2>
                      <p className="mt-1 text-[13px] text-text-secondary">{job.company} · {job.location}</p>
                    </div>
                    <Button size="sm" variant={saved ? 'ghost' : 'secondary'} disabled={saved} onClick={() => saveJob(job)}>
                      {saved ? 'Added' : 'Add to applications'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[12px] text-text-tertiary">
                    {job.category && <span>{job.category}</span>}
                    {job.contractType && <span>{job.contractType}</span>}
                    {job.contractTime && <span>{job.contractTime}</span>}
                    {salary && <span>{salary}</span>}
                  </div>
                  <p className="line-clamp-3 text-[13px] leading-6 text-text-secondary">{job.description}</p>
                  {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="inline-block text-[13px] font-medium text-accent-600 hover:text-accent-700">View job posting</a>}
                </CardBody>
              </Card>
            );
          })}
          {data.data.length === 0 && <p className="py-12 text-center text-sm text-text-secondary">No jobs matched your search.</p>}
        </div>
      )}

      {!submitted && <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong px-6 py-16 text-center text-sm text-text-secondary">Search by role, skill, and location to find your next opportunity.</div>}
    </div>
  );
};
