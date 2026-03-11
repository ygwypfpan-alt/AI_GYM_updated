import { Prisma, PrismaClient } from '@prisma/client';

export type {
  Booking,
  Conversation,
  Customer,
  FaqItem,
  HandoffRequest,
  Message,
  Service,
  Staff,
} from '@prisma/client';
export { Prisma };

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
