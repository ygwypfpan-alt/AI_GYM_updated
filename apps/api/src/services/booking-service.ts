import type { Prisma } from '@ai-gym/db';
import { prisma } from '@ai-gym/db';
import type { BookingDto } from '@ai-gym/shared';

import {
  addMinutes,
  dayOfWeekFromDateString,
  formatDateInTimezone,
  formatTimeInTimezone,
  isValidDate,
} from '../lib/datetime.js';
import { AppError } from '../lib/http.js';
import { getBusinessBySlug } from './business-service.js';
import { findOrCreateCustomer, type CustomerInput } from './customer-service.js';
import { mapBookingDto } from './serializers.js';

function isWithinRuleBounds(
  startTime: string,
  endTime: string,
  rule: { startTime: string; endTime: string },
): boolean {
  return rule.startTime <= startTime && rule.endTime >= endTime;
}

async function resolveRuleForSlot(params: {
  businessId: string;
  serviceId: string;
  staffId?: string | null;
  localDate: string;
  localStartTime: string;
  localEndTime: string;
}) {
  const filters: Prisma.AvailabilityRuleWhereInput[] = [
    {
      OR: [{ serviceId: params.serviceId }, { serviceId: null }],
    },
    {
      dayOfWeek: dayOfWeekFromDateString(params.localDate),
    },
  ];

  if (params.staffId) {
    filters.push({
      OR: [{ staffId: params.staffId }, { staffId: null }],
    });
  }

  const rules = await prisma.availabilityRule.findMany({
    where: {
      businessId: params.businessId,
      AND: filters,
    },
    orderBy: [{ staffId: 'asc' }, { startTime: 'asc' }],
  });

  const applicable = rules
    .filter((rule) =>
      isWithinRuleBounds(params.localStartTime, params.localEndTime, rule),
    )
    .sort((left, right) => {
      if ((left.staffId ?? null) === (params.staffId ?? null)) {
        return -1;
      }

      if ((right.staffId ?? null) === (params.staffId ?? null)) {
        return 1;
      }

      return 0;
    });

  if (applicable.length === 0) {
    throw new AppError('這個時段不在可預約範圍內。', 400);
  }

  const rule = applicable[0];

  if (!rule) {
    throw new AppError('No availability rule matched this slot.', 400);
  }

  return rule;
}

async function ensureSlotAvailable(params: {
  businessId: string;
  serviceId: string;
  staffId?: string | null;
  startAt: Date;
  endAt: Date;
  timeZone: string;
  excludeBookingId?: string;
}) {
  const localDate = formatDateInTimezone(params.startAt, params.timeZone);
  const localStartTime = formatTimeInTimezone(params.startAt, params.timeZone);
  const localEndTime = formatTimeInTimezone(params.endAt, params.timeZone);

  const rule = await resolveRuleForSlot({
    businessId: params.businessId,
    serviceId: params.serviceId,
    staffId: params.staffId,
    localDate,
    localStartTime,
    localEndTime,
  });

  const overlapCount = await prisma.booking.count({
    where: {
      businessId: params.businessId,
      serviceId: params.serviceId,
      staffId: rule.staffId ?? undefined,
      status: 'BOOKED',
      startAt: {
        lt: params.endAt,
      },
      endAt: {
        gt: params.startAt,
      },
      id: params.excludeBookingId
        ? {
            not: params.excludeBookingId,
          }
        : undefined,
    },
  });

  if (overlapCount >= rule.capacity) {
    throw new AppError('此時段剛好被訂走，請改選其他時段。', 409);
  }

  return rule;
}

export async function createBooking(input: {
  businessSlug?: string;
  serviceId: string;
  staffId?: string;
  slotStartAt: string;
  customer: CustomerInput;
  notes?: string;
  conversationId?: string;
}): Promise<BookingDto> {
  const business = await getBusinessBySlug(input.businessSlug);
  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      businessId: business.id,
      isActive: true,
    },
  });

  if (!service) {
    throw new AppError('找不到指定的服務。', 404);
  }

  if (!input.customer.name?.trim()) {
    throw new AppError('建立預約至少需要 customer.name。', 400);
  }

  const startAt = new Date(input.slotStartAt);

  if (!isValidDate(startAt)) {
    throw new AppError('slotStartAt 不是有效時間。', 400);
  }

  const endAt = addMinutes(startAt, service.durationMinutes);

  const rule = await ensureSlotAvailable({
    businessId: business.id,
    serviceId: service.id,
    staffId: input.staffId,
    startAt,
    endAt,
    timeZone: business.timezone,
  });

  const customer = await findOrCreateCustomer(business.id, input.customer);

  if (!customer) {
    throw new AppError('建立預約失敗，找不到 customer 資料。', 400);
  }

  let validatedConversationId: string | undefined = undefined;

  if (input.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        businessId: business.id,
      },
    });

    if (!conversation) {
      throw new AppError('找不到指定的 conversation。', 404);
    }

    validatedConversationId = conversation.id;

    if (!conversation.customerId) {
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          customerId: customer.id,
        },
      });
    }
  }

  const booking = await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      serviceId: service.id,
      staffId: rule.staffId ?? input.staffId ?? null,
      conversationId: validatedConversationId,
      status: 'BOOKED',
      startAt,
      endAt,
      notes: input.notes?.trim() || null,
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  });

  return mapBookingDto(booking);
}

export async function rescheduleBooking(input: {
  bookingId: string;
  slotStartAt: string;
  staffId?: string;
}): Promise<BookingDto> {
  const booking = await prisma.booking.findUnique({
    where: {
      id: input.bookingId,
    },
    include: {
      business: true,
      customer: true,
      service: true,
      staff: true,
    },
  });

  if (!booking) {
    throw new AppError('找不到指定的 booking。', 404);
  }

  if (booking.status === 'CANCELLED') {
    throw new AppError('這筆 booking 已取消，不能再改期。', 400);
  }

  const newStartAt = new Date(input.slotStartAt);

  if (!isValidDate(newStartAt)) {
    throw new AppError('slotStartAt 不是有效時間。', 400);
  }

  const newEndAt = addMinutes(newStartAt, booking.service.durationMinutes);
  const rule = await ensureSlotAvailable({
    businessId: booking.businessId,
    serviceId: booking.serviceId,
    staffId: input.staffId ?? booking.staffId,
    startAt: newStartAt,
    endAt: newEndAt,
    timeZone: booking.business.timezone,
    excludeBookingId: booking.id,
  });

  const updated = await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      startAt: newStartAt,
      endAt: newEndAt,
      staffId: rule.staffId ?? input.staffId ?? booking.staffId,
      updatedAt: new Date(),
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  });

  return mapBookingDto(updated);
}

export async function cancelBooking(input: {
  bookingId: string;
  reason?: string;
}): Promise<BookingDto> {
  const booking = await prisma.booking.findUnique({
    where: {
      id: input.bookingId,
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  });

  if (!booking) {
    throw new AppError('找不到指定的 booking。', 404);
  }

  const updated = await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      status: 'CANCELLED',
      cancellationReason: input.reason?.trim() || '使用者於網站聊天視窗取消',
      updatedAt: new Date(),
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  });

  return mapBookingDto(updated);
}
