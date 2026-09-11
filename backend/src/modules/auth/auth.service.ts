import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../common/AppError';
import { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schema';

const PASSWORD_SALT_ROUNDS = 12;

// Compared against when the email is unknown, so a failed login takes the same time
// whether or not the account exists (prevents timing-based user enumeration).
const DUMMY_HASH_PROMISE = bcrypt.hash('jobtrack-timing-equalizer', PASSWORD_SALT_ROUNDS);

const toPublicUser = (user: {
  id: string;
  email: string;
  name: string;
  skills: string[];
  yearsOfExperience: number | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  skills: user.skills,
  yearsOfExperience: user.yearsOfExperience,
});

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
    });

    return { user: toPublicUser(user), token: signToken(user.id) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const passwordMatches = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? (await DUMMY_HASH_PROMISE)
    );
    if (!user || !passwordMatches) {
      throw new AppError(401, 'Invalid email or password');
    }

    return { user: toPublicUser(user), token: signToken(user.id) };
  },

  async getById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'User no longer exists');
    }
    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { skills: input.skills, yearsOfExperience: input.yearsOfExperience },
    });
    return toPublicUser(user);
  },
};
