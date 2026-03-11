import type { Prisma } from '@ai-gym/db';
import { prisma } from '@ai-gym/db';
import type { AvailabilitySlot, ServiceSummary } from '@ai-gym/shared';

import {
  addMinutes,
  dayOfWeekFromDateString,
  formatDateInTimezone,
  formatSlotLabel,
  formatTimeInTimezone,
  listDateStrings,
  toDateAtBusinessTime,
  todayDateInTimezone,
} from '../lib/datetime.js';
import { AppError } from '../lib/http.js';
import { getBusinessBySlug } from './business-service.js';
import { mapServiceDto } from './serializers.js';

type ExistingBookingSlot = {
  id: string;
  startAt: Date;
  endAt: Date;
  staffId: string | null;
};

function overlaps(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export async function getAvailability(params: {
  businessSlug?: string;
  serviceId: string;
  staffId?: string;
  fromDate?: string;
  days?: number;
  excludeBookingId?: string;
}): Promise<{ service: ServiceSummary; slots: AvailabilitySlot[] }> {
  const business = await getBusinessBySlug(params.businessSlug);

  const service = await prisma.service.findFirst({
    where: {
      id: params.serviceId,
      businessId: business.id,
      isActive: true,
    },
  });

  if (!service) {
    throw new AppError('找不到指定的服務項目。', 404);
  }

  const whereAnd: Prisma.AvailabilityRuleWhereInput[] = [
    {
      OR: [{ serviceId: service.id }, { serviceId: null }],
    },
  ];

  if (params.staffId) {
    whereAnd.push({
      OR: [{ staffId: params.staffId }, { staffId: null }],
    });
  }

  const rules = await prisma.availabilityRule.findMany({
    where: {
      businessId: business.id,
      AND: whereAnd,
    },
    include: {
      staff: true,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  if (rules.length === 0) {
    throw new AppError('目前這個服務尚未設定可預約規則。', 400);
  }

  const days = Math.max(1, Math.min(params.days ?? 7, 14));
  const fromDate = params.fromDate ?? todayDateInTimezone(business.timezone);
  const dates = listDateStrings(fromDate, days);
  const lastDate = dates[dates.length - 1] ?? fromDate;

  const rangeStart = toDateAtBusinessTime(fromDate, '00:00', business.timezone);
  const rangeEnd = addMinutes(
    toDateAtBusinessTime(lastDate, '23:59', business.timezone),
    1,
  );

  const bookingWhere: Prisma.BookingWhereInput = {
    businessId: business.id,
    serviceId: service.id,
    status: 'BOOKED',
    startAt: {
      lt: rangeEnd,
    },
    endAt: {
      gt: rangeStart,
    },
  };

  if (params.staffId) {
    bookingWhere.staffId = params.staffId;
  }

  if (params.excludeBookingId) {
    bookingWhere.id = {
      not: params.excludeBookingId,
    };
  }

  const existingBookings: ExistingBookingSlot[] = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      staffId: true,
    },
  });

  const dedupe = new Set<string>();
  const slots: AvailabilitySlot[] = [];

  for (const date of dates) {
    const dayOfWeek = dayOfWeekFromDateString(date);

    for (const rule of rules) {
      if (rule.dayOfWeek !== dayOfWeek) {
        continue;
      }

      let pointer = toDateAtBusinessTime(date, rule.startTime, business.timezone);
      const ruleEnd = toDateAtBusinessTime(date, rule.endTime, business.timezone);

      while (pointer < ruleEnd) {
        const slotStart = pointer;
        const slotEnd = addMinutes(slotStart, service.durationMinutes);

        if (slotEnd > ruleEnd) {
          break;
        }

        const overlapCount = existingBookings.filter((booking: ExistingBookingSlot) => {
          const sameStaff = (booking.staffId ?? null) === (rule.staffId ?? null);
          return sameStaff && overlaps(slotStart, slotEnd, booking.startAt, booking.endAt);
        }).length;

        if (overlapCount < rule.capacity) {
          const key = `${slotStart.toISOString()}-${rule.staffId ?? 'unassigned'}`;

          if (!dedupe.has(key)) {
            dedupe.add(key);

            slots.push({
              startAt: slotStart.toISOString(),
              endAt: slotEnd.toISOString(),
              date: formatDateInTimezone(slotStart, business.timezone),
              startTime: formatTimeInTimezone(slotStart, business.timezone),
              endTime: formatTimeInTimezone(slotEnd, business.timezone),
              label: formatSlotLabel(slotStart, slotEnd, business.timezone),
              serviceId: service.id,
              serviceName: service.name,
              staffId: rule.staffId ?? null,
              staffName: rule.staff?.name ?? null,
              capacity: rule.capacity,
              remainingCapacity: rule.capacity - overlapCount,
            });
          }
        }

        pointer = addMinutes(slotStart, rule.slotIntervalMinutes);
      }
    }
  }

  slots.sort((left, right) => left.startAt.localeCompare(right.startAt));

  return {
    service: mapServiceDto(service),
    slots: slots.slice(0, 18),
  };
}
