import { api } from './axios';

export interface AtsResult {
  score: number;
  verdict: string;
  strengths: string[];
  issues: string[];
  missingKeywords: string[];
  recommendations: string[];
}

const appendJob = (form: FormData, companyName: string, jobTitle: string, jobDescription: string) => {
  form.append('companyName', companyName);
  form.append('jobTitle', jobTitle);
  form.append('jobDescription', jobDescription);
};

export const resumeToolsApi = {
  async ats(file: File, jobDescription: string) {
    const form = new FormData();
    form.append('resume', file);
    form.append('jobDescription', jobDescription);
    const { data } = await api.post<{ data: AtsResult }>('/resume-tools/ats/analyze', form);
    return data.data;
  },

  async summary(file: File, companyName: string, jobTitle: string, jobDescription: string) {
    const form = new FormData();
    form.append('resume', file);
    appendJob(form, companyName, jobTitle, jobDescription);
    const { data } = await api.post<{ data: { summary: string; matchedKeywords: string[] } }>('/resume-tools/summary', form);
    return data.data;
  },

  async coverLetter(file: File, companyName: string, jobTitle: string, jobDescription: string) {
    const form = new FormData();
    form.append('resume', file);
    appendJob(form, companyName, jobTitle, jobDescription);
    const { data } = await api.post<{ data: { coverLetter: string } }>('/resume-tools/cover-letter', form);
    return data.data;
  },
};
