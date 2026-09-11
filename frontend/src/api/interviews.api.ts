import { api } from './axios';
import { Interview } from '../types';

export interface InterviewInput {
  type: string;
  scheduledAt: string;
  durationMinutes?: number | null;
  interviewerName?: string | null;
  mode?: string | null;
  outcome?: string;
}

export const interviewsApi = {
  async list(applicationId: string) {
    const { data } = await api.get<{ data: Interview[] }>(`/applications/${applicationId}/interviews`);
    return data.data;
  },

  async create(applicationId: string, input: Partial<InterviewInput>) {
    const { data } = await api.post<{ data: Interview }>(
      `/applications/${applicationId}/interviews`,
      input
    );
    return data.data;
  },

  async update(id: string, input: Partial<InterviewInput>) {
    const { data } = await api.patch<{ data: Interview }>(`/interviews/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/interviews/${id}`);
  },
};
