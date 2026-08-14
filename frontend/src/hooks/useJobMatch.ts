import { useMutation } from '@tanstack/react-query';
import { jobMatchApi, AnalyzeJobPayload } from '../api/job-match.api';

export const useAnalyzeJobMatch = () =>
  useMutation({
    mutationFn: (payload: AnalyzeJobPayload) => jobMatchApi.analyze(payload),
  });
