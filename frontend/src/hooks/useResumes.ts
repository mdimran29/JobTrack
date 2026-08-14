import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResumeInput, resumesApi } from '../api/resumes.api';

export const resumesKeys = {
  all: ['resumes'] as const,
  matches: () => ['resumes', 'matches'] as const,
};

export const useResumes = () =>
  useQuery({ queryKey: resumesKeys.all, queryFn: resumesApi.list, staleTime: 30_000 });

export const useResumeMatches = () =>
  useQuery({ queryKey: resumesKeys.matches(), queryFn: () => resumesApi.matches(), staleTime: 30_000 });

export const useCreateResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResumeInput) => resumesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumesKeys.all }),
  });
};

export const useUpdateResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ResumeInput> }) => resumesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumesKeys.all }),
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumesKeys.all }),
  });
};
