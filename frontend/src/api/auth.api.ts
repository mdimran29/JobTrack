import { api } from './axios';
import { User } from '../types';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  skills: string[];
  yearsOfExperience: number;
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<{ data: User }>('/auth/register', payload);
    return data.data;
  },

  async login(payload: LoginPayload) {
    const { data } = await api.post<{ data: User }>('/auth/login', payload);
    return data.data;
  },

  async me() {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const { data } = await api.patch<{ data: User }>('/auth/profile', payload);
    return data.data;
  },
};
