import { PrismaClient, ApplicationStatus, InterviewType, InterviewOutcome } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // The demo account uses a well-known password; never create it on a production database.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Refusing to seed demo data in production. Set ALLOW_SEED=true to override.');
  }

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@jobtrack.dev' },
    update: {},
    create: {
      email: 'demo@jobtrack.dev',
      passwordHash,
      name: 'Demo User',
    },
  });

  await prisma.note.deleteMany({ where: { application: { userId: user.id } } });
  await prisma.interview.deleteMany({ where: { application: { userId: user.id } } });
  await prisma.jobApplication.deleteMany({ where: { userId: user.id } });

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  const applications = [
    {
      company: 'Vercel',
      position: 'Frontend Engineer',
      status: ApplicationStatus.INTERVIEW,
      appliedDate: daysAgo(20),
      location: 'Remote',
      source: 'LinkedIn',
      followUpDate: daysFromNow(2),
      interviews: [
        { type: InterviewType.PHONE_SCREEN, scheduledAt: daysAgo(14), outcome: InterviewOutcome.PASSED },
        { type: InterviewType.TECHNICAL, scheduledAt: daysFromNow(3), outcome: InterviewOutcome.PENDING },
      ],
      notes: ['Recruiter was very responsive. Emphasize React + performance work.'],
    },
    {
      company: 'Stripe',
      position: 'Backend Engineer',
      status: ApplicationStatus.TECHNICAL,
      appliedDate: daysAgo(15),
      location: 'Remote',
      source: 'Referral',
      followUpDate: daysFromNow(1),
      interviews: [
        { type: InterviewType.PHONE_SCREEN, scheduledAt: daysAgo(10), outcome: InterviewOutcome.PASSED },
        { type: InterviewType.TECHNICAL, scheduledAt: daysAgo(2), outcome: InterviewOutcome.PASSED },
      ],
      notes: ['Take-home due Friday. Focus on idempotency and API design.'],
    },
    {
      company: 'Notion',
      position: 'Full Stack Engineer',
      status: ApplicationStatus.OFFER,
      appliedDate: daysAgo(30),
      location: 'San Francisco, CA',
      source: 'Company site',
      interviews: [
        { type: InterviewType.ONSITE, scheduledAt: daysAgo(5), outcome: InterviewOutcome.PASSED },
      ],
      notes: ['Offer received: $145k base + equity. Need to respond by end of week.'],
    },
    {
      company: 'Figma',
      position: 'Software Engineer',
      status: ApplicationStatus.REJECTED,
      appliedDate: daysAgo(40),
      location: 'Remote',
      source: 'LinkedIn',
      interviews: [
        { type: InterviewType.PHONE_SCREEN, scheduledAt: daysAgo(35), outcome: InterviewOutcome.FAILED },
      ],
      notes: ['Rejected after phone screen. Feedback: wanted more design systems experience.'],
    },
    {
      company: 'Linear',
      position: 'Product Engineer',
      status: ApplicationStatus.APPLIED,
      appliedDate: daysAgo(3),
      location: 'Remote',
      source: 'Company site',
      followUpDate: daysFromNow(4),
      interviews: [],
      notes: [],
    },
    {
      company: 'Datadog',
      position: 'Software Engineer II',
      status: ApplicationStatus.SCREENING,
      appliedDate: daysAgo(7),
      location: 'New York, NY',
      source: 'Referral',
      followUpDate: daysAgo(1),
      interviews: [],
      notes: ['Recruiter screen scheduled for next week.'],
    },
    {
      company: 'Shopify',
      position: 'Backend Developer',
      status: ApplicationStatus.WITHDRAWN,
      appliedDate: daysAgo(25),
      location: 'Remote',
      source: 'LinkedIn',
      interviews: [],
      notes: ['Withdrew after accepting another offer.'],
    },
  ];

  for (const app of applications) {
    const { interviews, notes, ...appData } = app;
    await prisma.jobApplication.create({
      data: {
        ...appData,
        userId: user.id,
        interviews: { create: interviews },
        notes: { create: notes.map((content) => ({ content })) },
      },
    });
  }

  console.log(`Seeded user ${user.email} with ${applications.length} applications.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
