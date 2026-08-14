import { Prisma } from '@prisma/client';
import { AppError } from '../../common/AppError';
import { prisma } from '../../config/prisma';
import { CreateResumeInput, UpdateResumeInput } from './resumes.schema';

const findResume = (id: string, userId: string) =>
  prisma.resumeVersion.findFirst({ where: { id, userId } });

export const resumesService = {
  async list(userId: string) {
    return prisma.resumeVersion.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  },

  async getById(id: string, userId: string) {
    const resume = await findResume(id, userId);
    if (!resume) throw new AppError(404, 'Resume version not found');
    return resume;
  },

  async create(userId: string, input: CreateResumeInput) {
    return prisma.resumeVersion.create({ data: { ...input, userId } });
  },

  async update(id: string, userId: string, input: UpdateResumeInput) {
    await this.getById(id, userId);
    return prisma.resumeVersion.update({ where: { id }, data: input });
  },

  async remove(id: string, userId: string) {
    await this.getById(id, userId);
    await prisma.resumeVersion.delete({ where: { id } });
  },

  async listMatches(userId: string, limit: number) {
    return prisma.matchHistory.findMany({
      where: { userId },
      include: { resumeVersion: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getMatch(id: string, userId: string) {
    const match = await prisma.matchHistory.findFirst({ where: { id, userId }, include: { resumeVersion: true } });
    if (!match) throw new AppError(404, 'Match history entry not found');
    return match;
  },

  async removeMatch(id: string, userId: string) {
    await this.getMatch(id, userId);
    await prisma.matchHistory.delete({ where: { id } });
  },

  async recordMatch(userId: string, input: {
    resumeVersionId?: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    result: Prisma.InputJsonValue;
  }) {
    if (input.resumeVersionId) await this.getById(input.resumeVersionId, userId);
    return prisma.matchHistory.create({ data: { ...input, userId } });
  },
};
