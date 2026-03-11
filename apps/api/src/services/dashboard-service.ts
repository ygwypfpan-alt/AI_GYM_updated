import type { Prisma } from '@ai-gym/db';
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

type DashboardFilters = {
  query?: string;
  bookingStatus?: string;
};

function normalizeBookingStatus(value?: string) {
  if (value === 'BOOKED' || value === 'CANCELLED' || value === 'COMPLETED') {
    return value;
  }

  return undefined;
}

export async function getAdminDashboard(
  businessSlug?: string,
  filters?: DashboardFilters,
): Promise<DashboardData> {
  const business = await getBusinessBySlug(businessSlug);
  const query = filters?.query?.trim();
  const bookingStatus = normalizeBookingStatus(filters?.bookingStatus);

  const [
    bookings,
    faqItems,
    conversations,
    handoffRequests,
    services,
    staff,
    bookingCount,
    faqCount,
    conversationCount,
    handoffCount,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        status: bookingStatus,
        OR: query
          ? [
              {
                customer: {
                  is: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                customer: {
                  is: {
                    phone: {
                      contains: query,
                    },
                  },
                },
              },
              {
                customer: {
                  is: {
                    email: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                service: {
                  is: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                staff: {
                  is: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ]
          : undefined,
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: {
        startAt: 'desc',
      },
      take: 100,
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
    prisma.booking.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.faqItem.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.conversation.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.handoffRequest.count({
      where: {
        businessId: business.id,
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
      bookings: bookingCount,
      faqItems: faqCount,
      conversations: conversationCount,
      handoffRequests: handoffCount,
    },
    bookings: bookings.map((booking) =>
      mapBookingDto(
        booking as Prisma.BookingGetPayload<{
          include: {
            customer: true;
            service: true;
            staff: true;
          };
        }>,
      ),
    ),
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
