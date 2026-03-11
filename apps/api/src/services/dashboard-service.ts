import { prisma } from '@ai-gym/db';
import type { DashboardData } from '@ai-gym/shared';

import { getBusinessBySlug } from './business-service.js';
import {
  mapBookingDto,
  mapConversationSummary,
  mapFaqDto,
  mapHandoffRequestSummary,
  mapServiceDto,
} from './serializers.js';

type StaffMember = {
  id: string;
  name: string;
  isActive: boolean;
};

export async function getAdminDashboard(
  businessSlug?: string,
): Promise<DashboardData> {
  const business = await getBusinessBySlug(businessSlug);

  const [bookings, faqItems, conversations, handoffRequests, services, staff] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          customer: true,
          service: true,
          staff: true,
        },
        orderBy: {
          startAt: 'desc',
        },
        take: 50,
      }),
      prisma.faqItem.findMany({
        where: {
          businessId: business.id,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 50,
      }),
      prisma.conversation.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          customer: true,
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              text: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 50,
      }),
      prisma.handoffRequest.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      }),
      prisma.service.findMany({
        where: {
          businessId: business.id,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.staff.findMany({
        where: {
          businessId: business.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
      phone: business.phone ?? null,
      email: business.email ?? null,
      address: business.address ?? null,
    },
    counts: {
      bookings: bookings.length,
      faqItems: faqItems.length,
      conversations: conversations.length,
      handoffRequests: handoffRequests.length,
    },
    bookings: bookings.map(mapBookingDto),
    faqItems: faqItems.map(mapFaqDto),
    conversations: conversations.map(mapConversationSummary),
    handoffRequests: handoffRequests.map(mapHandoffRequestSummary),
    services: services.map(mapServiceDto),
    staff: staff.map((member: StaffMember) => ({
      id: member.id,
      name: member.name,
      isActive: member.isActive,
    })),
  };
}
