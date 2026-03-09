import { prisma } from '@ai-gym/db';
import type { ChatResponse, QuickReply } from '@ai-gym/shared';

import { detectIntent } from '../lib/intent.js';
import { matchServiceFromMessage } from '../lib/matchers.js';
import { getAvailability } from './availability-service.js';
import { getBusinessBySlug } from './business-service.js';
import { findOrCreateCustomer, type CustomerInput } from './customer-service.js';
import { searchFaqItems } from './faq-service.js';
import { createHandoffRequest } from './handoff-service.js';
import { mapServiceDto } from './serializers.js';

function defaultQuickReplies(): QuickReply[] {
  return [
    {
      label: '營業時間',
      kind: 'message',
      value: '請問營業時間是幾點到幾點？',
    },
    {
      label: '團體燃脂課時段',
      kind: 'message',
      value: '今晚還有團體燃脂課嗎？',
    },
    {
      label: '轉真人',
      kind: 'handoff',
      value: '網站聊天視窗要求轉真人',
    },
  ];
}

export async function processChatMessage(input: {
  businessSlug?: string;
  conversationId?: string;
  customer?: CustomerInput;
  message: string;
}): Promise<ChatResponse> {
  const business = await getBusinessBySlug(input.businessSlug);
  const customer = await findOrCreateCustomer(business.id, input.customer);
  const services = await prisma.service.findMany({
    where: {
      businessId: business.id,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const conversation = input.conversationId
    ? await prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          businessId: business.id,
        },
      })
    : null;

  const activeConversation =
    conversation ??
    (await prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customer?.id ?? null,
        status: 'OPEN',
      },
    }));

  if (customer?.id && !activeConversation.customerId) {
    await prisma.conversation.update({
      where: {
        id: activeConversation.id,
      },
      data: {
        customerId: customer.id,
      },
    });
  }

  const matchedService = matchServiceFromMessage(input.message, services);
  let intent = detectIntent(input.message);

  if (intent === 'UNKNOWN' && matchedService) {
    intent = 'AVAILABILITY';
  }

  await prisma.message.create({
    data: {
      conversationId: activeConversation.id,
      sender: 'USER',
      text: input.message,
      intent,
    },
  });

  let reply =
    '我目前可以處理 FAQ、查時段、預約、改期、取消與轉真人。你可以直接問「今晚還有團體燃脂課嗎？」';
  let quickReplies = defaultQuickReplies();
  let faqItems = await searchFaqItems({
    businessSlug: business.slug,
    query: '',
    limit: 3,
  });
  let suggestedServices = services.map(mapServiceDto);
  let suggestedSlots: ChatResponse['suggestedSlots'] = [];
  let handoffRequestId: string | null = null;

  if (intent === 'GREETING') {
    reply =
      '你好！我是 AI 預約助手，可以幫你查 FAQ、看可預約時段、建立預約、改期、取消，也能幫你轉真人。';
  }

  if (intent === 'FAQ') {
    const matches = await searchFaqItems({
      businessSlug: business.slug,
      query: input.message,
      limit: 3,
    });

    if (matches.length > 0) {
      faqItems = matches;
      reply =
        '我先整理最相關的 FAQ 給你。若你下一步想查時段，也可以直接點課程或直接問我。';
      suggestedServices = services.map(mapServiceDto);
    } else {
      reply =
        '目前沒有找到完全相符的 FAQ，我先提供熱門問題。你也可以直接問「營業時間」、「停車」或「淋浴間」。';
    }
  }

  if (intent === 'AVAILABILITY' || intent === 'BOOKING') {
    if (!matchedService) {
      reply =
        '你想查哪一種課程呢？先選服務，我就能列出最近的可預約時段。';
      suggestedServices = services.map(mapServiceDto);
      faqItems = [];
    } else {
      const availability = await getAvailability({
        businessSlug: business.slug,
        serviceId: matchedService.id,
        days: 7,
      });

      suggestedSlots = availability.slots;
      suggestedServices = [mapServiceDto(matchedService)];
      faqItems = [];

      if (suggestedSlots.length > 0) {
        reply = `我找到 ${availability.service.name} 最近 ${suggestedSlots.length} 個可預約時段，直接點下面時段就能建立預約。`;
      } else {
        reply =
          '這個服務最近 7 天暫時沒有可預約時段。你可以改查其他課程，或先送出轉真人請求。';
        quickReplies = [
          ...services
            .filter((service) => service.id !== matchedService.id)
            .slice(0, 2)
            .map((service) => ({
              label: service.name,
              kind: 'service' as const,
              value: service.name,
              serviceId: service.id,
            })),
          {
            label: '轉真人',
            kind: 'handoff' as const,
            value: '此服務近 7 天沒有時段，請真人協助',
          },
        ];
      }
    }
  }

  if (intent === 'RESCHEDULE') {
    faqItems = [];
    suggestedServices = [];
    reply =
      '可以，若你已經建立預約，請直接在聊天視窗下方的「目前預約」卡片按「改期」，系統會再列出可改的時段。';
    quickReplies = [
      {
        label: '先看團體燃脂課時段',
        kind: 'message',
        value: '今晚還有團體燃脂課嗎？',
      },
      {
        label: '轉真人',
        kind: 'handoff',
        value: '我需要真人協助改期',
      },
    ];
  }

  if (intent === 'CANCEL') {
    faqItems = [];
    suggestedServices = [];
    reply =
      '可以，若你已經建立預約，請直接在聊天視窗下方的「目前預約」卡片按「取消預約」。';
    quickReplies = [
      {
        label: '查看 FAQ',
        kind: 'message',
        value: '預約後可以取消或改期嗎？',
      },
      {
        label: '轉真人',
        kind: 'handoff',
        value: '我需要真人協助取消',
      },
    ];
  }

  if (intent === 'HANDOFF') {
    const handoff = await createHandoffRequest({
      businessSlug: business.slug,
      conversationId: activeConversation.id,
      customer: input.customer,
      note: input.message,
    });

    reply =
      '已幫你送出轉真人請求，後台頁面會立即看到這筆需求。你也可以先繼續問 FAQ 或查時段。';
    faqItems = [];
    suggestedServices = [];
    suggestedSlots = [];
    quickReplies = [
      {
        label: '回到 FAQ',
        kind: 'message',
        value: '請問營業時間是幾點到幾點？',
      },
      {
        label: '查看團體課時段',
        kind: 'message',
        value: '今晚還有團體燃脂課嗎？',
      },
    ];
    handoffRequestId = handoff.id;
  }

  if (intent === 'UNKNOWN') {
    const faqMatches = await searchFaqItems({
      businessSlug: business.slug,
      query: input.message,
      limit: 3,
    });

    if (faqMatches.length > 0) {
      faqItems = faqMatches;
      reply =
        '我先幫你從 FAQ 裡抓到最相關的答案。如果你想下一步查時段，也可以直接問課程名稱。';
    } else {
      faqItems = [];
      suggestedServices = services.map(mapServiceDto);
      reply =
        '我還無法完全理解這句話，但我可以幫你做 FAQ、查時段、預約、改期、取消與轉真人。你可以直接點下面快速選項。';
    }
  }

  await prisma.message.create({
    data: {
      conversationId: activeConversation.id,
      sender: 'BOT',
      text: reply,
      intent,
      metadata: {
        faqCount: faqItems.length,
        suggestedSlotCount: suggestedSlots.length,
      },
    },
  });

  return {
    conversationId: activeConversation.id,
    customerId: customer?.id ?? null,
    intent,
    reply,
    quickReplies,
    faqItems,
    suggestedServices,
    suggestedSlots,
    handoffRequestId,
  };
}
