import { useQuery } from '@tanstack/react-query';
import { jobSearchApi, JobSearchParams } from '../api/job-search.api';

export const useJobSearch = (params: JobSearchParams | null) =>
  useQuery({
    queryKey: ['job-search', params],
    queryFn: () => jobSearchApi.search(params as JobSearchParams),
    enabled: Boolean(params?.keyword),
    staleTime: 60_000,
  });
