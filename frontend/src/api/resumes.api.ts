import { api } from './axios';

export interface ResumeVersion {
  id: string;
  userId: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeInput {
  name: string;
  content: string;
}

export interface ResumeMatch {
  id: string;
  resumeVersionId: string | null;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  result: Record<string, unknown>;
  createdAt: string;
  resumeVersion: { id: string; name: string } | null;
}

export const resumesApi = {
  async list() {
    const { data } = await api.get<{ data: ResumeVersion[] }>('/resumes');
    return data.data;
  },

  async create(input: ResumeInput) {
    const { data } = await api.post<{ data: ResumeVersion }>('/resumes', input);
    return data.data;
  },

  async update(id: string, input: Partial<ResumeInput>) {
    const { data } = await api.patch<{ data: ResumeVersion }>(`/resumes/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/resumes/${id}`);
  },

  async matches(limit = 20) {
    const { data } = await api.get<{ data: ResumeMatch[] }>('/resumes/matches', { params: { limit } });
    return data.data;
  },
};
