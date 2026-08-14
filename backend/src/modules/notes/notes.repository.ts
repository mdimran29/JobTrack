import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const notesRepository = {
  async findApplicationForUser(applicationId: string, userId: string) {
    return prisma.jobApplication.findFirst({ where: { id: applicationId, userId } });
  },

  async listByApplication(applicationId: string) {
    return prisma.note.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(applicationId: string, content: string) {
    return prisma.note.create({ data: { applicationId, content } });
  },

  async findByIdForUser(id: string, userId: string) {
    return prisma.note.findFirst({ where: { id, application: { userId } } });
  },

  async updateById(id: string, data: Prisma.NoteUpdateInput) {
    return prisma.note.update({ where: { id }, data });
  },

  async deleteById(id: string) {
    await prisma.note.delete({ where: { id } });
  },
};
