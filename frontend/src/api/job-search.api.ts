import { api } from './axios';

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTime: string | null;
  contractType: string | null;
  createdAt: string | null;
}

export interface JobSearchParams {
  keyword: string;
  location?: string;
  page?: number;
  limit?: number;
}

export const jobSearchApi = {
  async search(params: JobSearchParams) {
    const { data } = await api.get<{ data: JobSearchResult[]; meta: { page: number; limit: number; total: number } }>(
      '/job-search/search',
      { params }
    );
    return data;
  },
};
