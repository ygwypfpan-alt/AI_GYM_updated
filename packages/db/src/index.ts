import { Prisma, PrismaClient } from '@prisma/client';

export type Booking = Prisma.$BookingPayload['scalars'];
export type Conversation = Prisma.$ConversationPayload['scalars'];
export type Customer = Prisma.$CustomerPayload['scalars'];
export type FaqItem = Prisma.$FaqItemPayload['scalars'];
export type HandoffRequest = Prisma.$HandoffRequestPayload['scalars'];
export type Message = Prisma.$MessagePayload['scalars'];
export type Service = Prisma.$ServicePayload['scalars'];
export type Staff = Prisma.$StaffPayload['scalars'];
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
