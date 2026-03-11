import { Prisma, PrismaClient } from '@prisma/client';

export type Booking = Prisma.BookingGetPayload<Record<string, never>>;
export type Conversation = Prisma.ConversationGetPayload<Record<string, never>>;
export type Customer = Prisma.CustomerGetPayload<Record<string, never>>;
export type FaqItem = Prisma.FaqItemGetPayload<Record<string, never>>;
export type HandoffRequest = Prisma.HandoffRequestGetPayload<Record<string, never>>;
export type Message = Prisma.MessageGetPayload<Record<string, never>>;
export type Service = Prisma.ServiceGetPayload<Record<string, never>>;
export type Staff = Prisma.StaffGetPayload<Record<string, never>>;
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
