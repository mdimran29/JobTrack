import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api/notes.api';
import { applicationsKeys } from './useApplications';

export const useNotes = (applicationId: string) =>
  useQuery({
    queryKey: ['notes', applicationId],
    queryFn: () => notesApi.list(applicationId),
    enabled: Boolean(applicationId),
  });

const invalidate = (queryClient: ReturnType<typeof useQueryClient>, applicationId: string) => {
  queryClient.invalidateQueries({ queryKey: applicationsKeys.detail(applicationId) });
  queryClient.invalidateQueries({ queryKey: ['notes', applicationId] });
};

export const useCreateNote = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => notesApi.create(applicationId, content),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};

export const useUpdateNote = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => notesApi.update(id, content),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};

export const useDeleteNote = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => invalidate(queryClient, applicationId),
  });
};
