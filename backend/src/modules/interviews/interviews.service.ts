import { AppError } from '../../common/AppError';
import { interviewsRepository } from './interviews.repository';
import { CreateInterviewInput, UpdateInterviewInput } from './interviews.schema';

const assertApplicationOwnership = async (applicationId: string, userId: string) => {
  const application = await interviewsRepository.findApplicationForUser(applicationId, userId);
  if (!application) {
    throw new AppError(404, 'Application not found');
  }
};

export const interviewsService = {
  async list(applicationId: string, userId: string) {
    await assertApplicationOwnership(applicationId, userId);
    return interviewsRepository.listByApplication(applicationId);
  },

  async create(applicationId: string, userId: string, input: CreateInterviewInput) {
    await assertApplicationOwnership(applicationId, userId);
    return interviewsRepository.create(applicationId, input);
  },

  async update(id: string, userId: string, input: UpdateInterviewInput) {
    const existing = await interviewsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Interview not found');
    }
    return interviewsRepository.updateById(id, input);
  },

  async remove(id: string, userId: string) {
    const existing = await interviewsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError(404, 'Interview not found');
    }
    await interviewsRepository.deleteById(id);
  },
};
