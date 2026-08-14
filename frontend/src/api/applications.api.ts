import { api } from './axios';
import {
  ApplicationListParams,
  JobApplication,
  JobApplicationDetail,
  PaginatedResponse,
} from '../types';

export interface ApplicationInput {
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  jobUrl?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  source?: string;
  followUpDate?: string;
}

export const applicationsApi = {
  async list(params: ApplicationListParams) {
    const { data } = await api.get<PaginatedResponse<JobApplication>>('/applications', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ data: JobApplicationDetail }>(`/applications/${id}`);
    return data.data;
  },

  async create(input: Partial<ApplicationInput>) {
    const { data } = await api.post<{ data: JobApplication }>('/applications', input);
    return data.data;
  },

  async update(id: string, input: Partial<ApplicationInput>) {
    const { data } = await api.patch<{ data: JobApplication }>(`/applications/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/applications/${id}`);
  },

  async followUps() {
    const { data } = await api.get<{ data: JobApplication[] }>('/applications/follow-ups');
    return data.data;
  },
};
