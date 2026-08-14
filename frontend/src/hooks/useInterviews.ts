import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewsApi, InterviewInput } from '../api/interviews.api';
import { applicationsKeys } from './useApplications';

export const useInterviews = (applicationId: string) =>
  useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: () => interviewsApi.list(applicationId),
    enabled: Boolean(applicationId),
  });

const invalidate = (queryClient: ReturnType<typeof useQueryClient>, applicationId: string) => {
  queryClient.invalidateQueries({ queryKey: applicationsKeys.detail(applicationId) });
  queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
};

export const useCreateInterview = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<InterviewInput>) => interviewsApi.create(applicationId, input),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};

export const useUpdateInterview = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InterviewInput> }) =>
      interviewsApi.update(id, input),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};

export const useDeleteInterview = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interviewsApi.remove(id),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};
