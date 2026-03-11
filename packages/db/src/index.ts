import { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
};

export type FaqItem = {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  keywords: string[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type Staff = {
  id: string;
  name: string;
};

export type Booking = {
  id: string;
  status: string;
  startAt: Date;
  endAt: Date;
  serviceId: string;
  staffId: string | null;
  customerId: string;
  notes: string | null;
  cancellationReason: string | null;
};

export type Conversation = {
  id: string;
  status: string;
  startedAt: Date;
};

export type Message = {
  text: string;
  createdAt: Date;
};

export type HandoffRequest = {
  id: string;
  status: string;
  createdAt: Date;
  name: string | null;
  phone: string | null;
  note: string | null;
  conversationId: string | null;
};

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
