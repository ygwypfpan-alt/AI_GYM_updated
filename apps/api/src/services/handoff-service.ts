import { prisma } from '@ai-gym/db';
import type { HandoffRequestSummary } from '@ai-gym/shared';

import { AppError } from '../lib/http.js';
import { getBusinessBySlug } from './business-service.js';
import { findOrCreateCustomer, type CustomerInput } from './customer-service.js';
import { mapHandoffRequestSummary } from './serializers.js';

export async function createHandoffRequest(input: {
  businessSlug?: string;
  conversationId?: string;
  customer?: CustomerInput;
  note?: string;
}): Promise<HandoffRequestSummary> {
  const business = await getBusinessBySlug(input.businessSlug);
  const customer = await findOrCreateCustomer(business.id, input.customer);

  let conversationId: string | undefined = undefined;

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

    conversationId = conversation.id;

    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        status: 'HANDED_OFF',
        customerId: conversation.customerId ?? customer?.id ?? null,
        updatedAt: new Date(),
      },
    });

    const existingPending = await prisma.handoffRequest.findFirst({
      where: {
        businessId: business.id,
        conversationId: conversation.id,
        status: 'PENDING',
      },
      include: {
        customer: true,
      },
    });

    if (existingPending) {
      return mapHandoffRequestSummary(existingPending);
    }
  }

  const request = await prisma.handoffRequest.create({
    data: {
      businessId: business.id,
      conversationId,
      customerId: customer?.id,
      status: 'PENDING',
      name: input.customer?.name?.trim() || customer?.name || null,
      phone: input.customer?.phone?.trim() || customer?.phone || null,
      note: input.note?.trim() || '網站聊天視窗要求轉真人',
    },
    include: {
      customer: true,
    },
  });

  return mapHandoffRequestSummary(request);
}
