import { AppError } from '../../common/AppError';
import { notesRepository } from './notes.repository';

const assertApplicationOwnership = async (applicationId: string, userId: string) => {
  const application = await notesRepository.findApplicationForUser(applicationId, userId);
  if (!application) {
    throw new AppError(404, 'Application not found');
  }
};

export const notesService = {
  async list(applicationId: string, userId: string) {
    await assertApplicationOwnership(applicationId, userId);
    return notesRepository.listByApplication(applicationId);
  },

  async create(applicationId: string, userId: string, content: string) {
    await assertApplicationOwnership(applicationId, userId);
    return notesRepository.create(applicationId, content);
  },

  async update(id: string, userId: string, content: string) {
    const existing = await notesRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Note not found');
    }
    return notesRepository.updateById(id, { content });
  },

  async remove(id: string, userId: string) {
    const existing = await notesRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Note not found');
    }
    await notesRepository.deleteById(id);
  },
};
