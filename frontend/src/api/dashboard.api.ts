import { api } from './axios';
import { DashboardStats } from '../types';

export const dashboardApi = {
  async stats() {
    const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats');
    return data.data;
  },
};
