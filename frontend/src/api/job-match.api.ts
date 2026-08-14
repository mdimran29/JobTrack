import { api } from './axios';
import { JobMatchResult } from '../types';

export interface AnalyzeJobPayload {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumeFile?: File;
}

export const jobMatchApi = {
  async analyze(payload: AnalyzeJobPayload) {
    const formData = new FormData();
    formData.append('companyName', payload.companyName);
    formData.append('jobTitle', payload.jobTitle);
    formData.append('jobDescription', payload.jobDescription);
    if (payload.resumeFile) formData.append('resume', payload.resumeFile);

    const { data } = await api.post<{ data: JobMatchResult }>('/job-match/analyze', formData);
    return data.data;
  },
};
