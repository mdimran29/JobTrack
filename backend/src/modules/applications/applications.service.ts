import { AppError } from '../../common/AppError';
import { parsePagination, buildMeta } from '../../common/pagination';
import { applicationsRepository } from './applications.repository';
import { CreateApplicationInput, ListApplicationsQuery, UpdateApplicationInput } from './applications.schema';
import { resumesService } from '../resumes/resumes.service';

export const applicationsService = {
  async list(userId: string, query: ListApplicationsQuery) {
    const { skip, take } = parsePagination({ page: query.page, limit: query.limit });

    const { data, total } = await applicationsRepository.list({
      userId,
      status: query.status,
      search: query.search,
      sortBy: query.sortBy,
      order: query.order,
      skip,
      take,
    });

    return { data, meta: buildMeta(query.page, query.limit, total) };
  },

  async getById(id: string, userId: string) {
    const application = await applicationsRepository.findByIdForUser(id, userId);
    if (!application) {
      throw new AppError(404, 'Application not found');
    }
    return application;
  },

  async create(userId: string, input: CreateApplicationInput) {
    if (input.resumeVersionId) await resumesService.getById(input.resumeVersionId, userId);
    return applicationsRepository.create(userId, input);
  },

  async update(id: string, userId: string, input: UpdateApplicationInput) {
    const existing = await applicationsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Application not found');
    }
    if (input.resumeVersionId) await resumesService.getById(input.resumeVersionId, userId);
    return applicationsRepository.updateById(id, input);
  },

  async remove(id: string, userId: string) {
    const existing = await applicationsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Application not found');
    }
    await applicationsRepository.deleteById(id);
  },

  async followUps(userId: string) {
    return applicationsRepository.findFollowUps(userId);
  },
};
