import { api } from './axios';
import { Note } from '../types';

export const notesApi = {
  async list(applicationId: string) {
    const { data } = await api.get<{ data: Note[] }>(`/applications/${applicationId}/notes`);
    return data.data;
  },

  async create(applicationId: string, content: string) {
    const { data } = await api.post<{ data: Note }>(`/applications/${applicationId}/notes`, {
      content,
    });
    return data.data;
  },

  async update(id: string, content: string) {
    const { data } = await api.patch<{ data: Note }>(`/notes/${id}`, { content });
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/notes/${id}`);
  },
};
