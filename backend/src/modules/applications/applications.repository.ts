import { ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface ListApplicationsFilters {
  userId: string;
  status?: ApplicationStatus;
  search?: string;
  sortBy: 'appliedDate' | 'company' | 'status' | 'updatedAt';
  order: 'asc' | 'desc';
  skip: number;
  take: number;
}

const detailInclude = {
  interviews: { orderBy: { scheduledAt: Prisma.SortOrder.desc } },
  notes: { orderBy: { createdAt: Prisma.SortOrder.desc } },
} satisfies Prisma.JobApplicationInclude;

export const applicationsRepository = {
  async list(filters: ListApplicationsFilters) {
    const where: Prisma.JobApplicationWhereInput = {
      userId: filters.userId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { company: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
              { position: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy: { [filters.sortBy]: filters.order },
        skip: filters.skip,
        take: filters.take,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return { data, total };
  },

  async findByIdForUser(id: string, userId: string) {
    return prisma.jobApplication.findFirst({
      where: { id, userId },
      include: detailInclude,
    });
  },

  async create(userId: string, data: Omit<Prisma.JobApplicationUncheckedCreateInput, 'userId'>) {
    return prisma.jobApplication.create({ data: { ...data, userId } });
  },

  async updateById(id: string, data: Prisma.JobApplicationUpdateInput) {
    return prisma.jobApplication.update({ where: { id }, data });
  },

  async deleteById(id: string) {
    await prisma.jobApplication.delete({ where: { id } });
  },

  async findFollowUps(userId: string) {
    return prisma.jobApplication.findMany({
      where: {
        userId,
        followUpDate: { lte: new Date() },
        status: { notIn: [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN] },
      },
      orderBy: { followUpDate: 'asc' },
    });
  },
};
