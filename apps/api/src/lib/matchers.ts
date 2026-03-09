import type { Service } from '@ai-gym/db';
import { normalizeMessageText } from '@ai-gym/shared';

type ServiceLike = Pick<
  Service,
  'id' | 'name' | 'description' | 'durationMinutes' | 'price'
>;

function splitKeywords(text: string): string[] {
  return text
    .split(/[^\p{L}\p{N}]+/u)
    .map((value) => normalizeMessageText(value))
    .filter((value) => value.length > 1);
}

function addAliases(
  keywords: Set<string>,
  aliases: string[],
) {
  for (const alias of aliases) {
    keywords.add(normalizeMessageText(alias));
  }
}

function serviceKeywords(service: ServiceLike): string[] {
  const keywords = new Set<string>();
  const normalizedName = normalizeMessageText(service.name);

  keywords.add(normalizedName);
  splitKeywords(service.name).forEach((keyword) => keywords.add(keyword));

  if (service.description) {
    splitKeywords(service.description).forEach((keyword) => keywords.add(keyword));
  }

  if (
    normalizedName.includes(normalizeMessageText('\u4e00\u5c0d\u4e00')) ||
    normalizedName.includes('pt')
  ) {
    addAliases(keywords, [
      '\u4e00\u5c0d\u4e00',
      '\u6559\u7df4\u8ab2',
      '\u4e00\u5c0d\u4e00\u6559\u7df4\u8ab2',
      'pt',
      'personal',
      'trainer',
    ]);
  }

  if (
    normalizedName.includes(normalizeMessageText('\u5718\u9ad4')) ||
    normalizedName.includes('hiit')
  ) {
    addAliases(keywords, [
      '\u5718\u9ad4',
      '\u5718\u8ab2',
      '\u71c3\u8102',
      '\u5718\u9ad4\u71c3\u8102\u8ab2',
      'hiit',
      'group',
    ]);
  }

  if (
    normalizedName.includes(normalizeMessageText('\u9ad4\u9a57')) ||
    normalizedName.includes(normalizeMessageText('\u65b0\u624b'))
  ) {
    addAliases(keywords, [
      '\u65b0\u624b',
      '\u9ad4\u9a57',
      '\u65b0\u624b\u9ad4\u9a57\u8a13\u7df4',
      '\u7b2c\u4e00\u6b21',
      '\u5165\u9580',
      'trial',
    ]);
  }

  return [...keywords];
}

export function matchServiceFromMessage(
  message: string,
  services: ServiceLike[],
): ServiceLike | null {
  const normalized = normalizeMessageText(message);
  let bestMatch: { service: ServiceLike; score: number } | null = null;

  for (const service of services) {
    let score = 0;
    const normalizedName = normalizeMessageText(service.name);

    if (normalized.includes(normalizedName)) {
      score += 8;
    }

    for (const keyword of serviceKeywords(service)) {
      if (normalized.includes(keyword)) {
        score += keyword === normalizedName ? 5 : 2;
      }
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { service, score };
    }
  }

  if (!bestMatch || bestMatch.score <= 0) {
    return null;
  }

  return bestMatch.service;
}
