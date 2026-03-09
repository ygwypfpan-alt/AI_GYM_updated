import { prisma } from '@ai-gym/db';
import type { FaqItemDto } from '@ai-gym/shared';
import { normalizeMessageText } from '@ai-gym/shared';

import { getBusinessBySlug } from './business-service.js';
import { mapFaqDto } from './serializers.js';

function scoreFaq(
  query: string,
  item: { question: string; answer: string; keywords: string[] },
): number {
  const normalizedQuery = normalizeMessageText(query);
  const queryTokens = normalizedQuery
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const normalizedQuestion = normalizeMessageText(item.question);
  const normalizedAnswer = normalizeMessageText(item.answer);

  let score = 0;

  if (normalizedQuestion.includes(normalizedQuery)) {
    score += 8;
  }

  for (const keyword of item.keywords) {
    const normalizedKeyword = normalizeMessageText(keyword);

    if (
      normalizedQuery.includes(normalizedKeyword) ||
      normalizedKeyword.includes(normalizedQuery)
    ) {
      score += 5;
    }
  }

  for (const token of queryTokens) {
    if (normalizedQuestion.includes(token)) {
      score += 2;
    }

    if (normalizedAnswer.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export async function searchFaqItems(params: {
  businessSlug?: string;
  query?: string;
  limit?: number;
}): Promise<FaqItemDto[]> {
  const business = await getBusinessBySlug(params.businessSlug);

  const items = await prisma.faqItem.findMany({
    where: {
      businessId: business.id,
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const limit = Math.max(1, Math.min(params.limit ?? 6, 20));

  if (!params.query?.trim()) {
    return items.slice(0, limit).map(mapFaqDto);
  }

  return items
    .map((item) => ({
      item,
      score: scoreFaq(params.query ?? '', item),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => mapFaqDto(entry.item));
}
