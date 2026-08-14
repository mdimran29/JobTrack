import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi, ApplicationInput } from '../api/applications.api';
import { ApplicationListParams } from '../types';

export const applicationsKeys = {
  list: (params: ApplicationListParams) => ['applications', params] as const,
  detail: (id: string) => ['applications', id] as const,
  followUps: () => ['applications', 'follow-ups'] as const,
};

export const useApplications = (params: ApplicationListParams) =>
  useQuery({
    queryKey: applicationsKeys.list(params),
    queryFn: () => applicationsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useApplication = (id: string | undefined) =>
  useQuery({
    queryKey: applicationsKeys.detail(id ?? ''),
    queryFn: () => applicationsApi.getById(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

export const useFollowUps = () =>
  useQuery({
    queryKey: applicationsKeys.followUps(),
    queryFn: () => applicationsApi.followUps(),
    staleTime: 30_000,
  });

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ApplicationInput>) => applicationsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ApplicationInput> }) =>
      applicationsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};
