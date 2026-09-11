import { AppError } from '../../common/AppError';
import { env } from '../../config/env';
import { SearchJobsQuery } from './job-search.schema';
import { setDefaultResultOrder } from 'node:dns';
import https from 'node:https';

setDefaultResultOrder('ipv4first');

const requestJson = (url: string): Promise<AdzunaResponse> =>
  new Promise((resolve, reject) => {
    const request = https.get(url, { family: 4, timeout: 10000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if ((response.statusCode ?? 500) >= 400) {
          reject(new Error(`Adzuna returned ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body) as AdzunaResponse);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('Adzuna request timed out')));
    request.on('error', reject);
  });

interface AdzunaResponse {
  count?: number;
  results?: Array<{
    id?: string;
    title?: string;
    description?: string;
    redirect_url?: string;
    created?: string;
    company?: { display_name?: string };
    location?: { display_name?: string };
    category?: { label?: string };
    salary_min?: number;
    salary_max?: number;
    contract_time?: string;
    contract_type?: string;
  }>;
}

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

export const jobSearchService = {
  async search(query: SearchJobsQuery) {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
      throw new AppError(503, 'Job search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to backend/.env.', 'JOB_SEARCH_NOT_CONFIGURED');
    }

    const params = new URLSearchParams({
      app_id: env.ADZUNA_APP_ID,
      app_key: env.ADZUNA_APP_KEY,
      results_per_page: String(query.limit),
      what: query.keyword,
      'content-type': 'application/json',
    });
    if (query.location) params.set('where', query.location);

    let payload: AdzunaResponse;
    try {
      payload = await requestJson(`https://api.adzuna.com/v1/api/jobs/in/search/${query.page}?${params}`);
    } catch (error) {
      console.error('Adzuna job search request failed:', error);
      throw new AppError(502, 'The job search provider is unavailable right now. Try again shortly.', 'JOB_SEARCH_PROVIDER_FAILED');
    }
    const data: JobSearchResult[] = (payload.results ?? []).map((job, index) => ({
      id: job.id ?? `${query.page}-${index}-${job.title ?? 'job'}`,
      title: job.title ?? 'Untitled role',
      company: job.company?.display_name ?? 'Company not listed',
      location: job.location?.display_name ?? query.location ?? 'Location not listed',
      description: job.description ?? '',
      url: job.redirect_url ?? '',
      category: job.category?.label ?? null,
      salaryMin: job.salary_min ?? null,
      salaryMax: job.salary_max ?? null,
      contractTime: job.contract_time ?? null,
      contractType: job.contract_type ?? null,
      createdAt: job.created ?? null,
    }));

    return { data, meta: { page: query.page, limit: query.limit, total: payload.count ?? data.length } };
  },
};
