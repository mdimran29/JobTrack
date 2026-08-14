import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

const round = (value: number) => Math.round(value * 1000) / 1000;

export const dashboardService = {
  async getStats(userId: string) {
    const [total, statusGroups, interviewedCount, offerCount, recentActivity] = await Promise.all([
      prisma.jobApplication.count({ where: { userId } }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.jobApplication.count({
        where: { userId, interviews: { some: {} } },
      }),
      prisma.jobApplication.count({
        where: { userId, status: ApplicationStatus.OFFER },
      }),
      prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, company: true, position: true, status: true, updatedAt: true },
      }),
    ]);

    const byStatus = Object.fromEntries(
      Object.values(ApplicationStatus).map((status) => [status, 0])
    ) as Record<ApplicationStatus, number>;
    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all;
    }

    return {
      totalApplications: total,
      byStatus,
      interviewRate: total > 0 ? round(interviewedCount / total) : 0,
      offerRate: total > 0 ? round(offerCount / total) : 0,
      recentActivity,
    };
  },
};
