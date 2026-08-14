import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const interviewsRepository = {
  async findApplicationForUser(applicationId: string, userId: string) {
    return prisma.jobApplication.findFirst({ where: { id: applicationId, userId } });
  },

  async listByApplication(applicationId: string) {
    return prisma.interview.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: 'desc' },
    });
  },

  async create(applicationId: string, data: Omit<Prisma.InterviewUncheckedCreateInput, 'applicationId'>) {
    return prisma.interview.create({ data: { ...data, applicationId } });
  },

  async findByIdForUser(id: string, userId: string) {
    return prisma.interview.findFirst({ where: { id, application: { userId } } });
  },

  async updateById(id: string, data: Prisma.InterviewUpdateInput) {
    return prisma.interview.update({ where: { id }, data });
  },

  async deleteById(id: string) {
    await prisma.interview.delete({ where: { id } });
  },
};
