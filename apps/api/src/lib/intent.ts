import type { IntentName } from '@ai-gym/shared';
import { normalizeMessageText } from '@ai-gym/shared';

const handoffKeywords = [
  '\u771f\u4eba',
  '\u4eba\u5de5',
  '\u5ba2\u670d',
  '\u5c08\u4eba',
  '\u9867\u554f',
  '\u5354\u52a9',
  '\u806f\u7d61\u6211',
  '\u8f49\u63a5',
  '\u8f49\u771f\u4eba',
  'human',
  'agent',
  'staff',
  'operator',
];

const cancelKeywords = [
  '\u53d6\u6d88\u9810\u7d04',
  '\u53d6\u6d88',
  '\u4e0d\u8981\u4e86',
  '\u5148\u4e0d\u8981',
  'cancel',
];

const rescheduleKeywords = [
  '\u6539\u671f',
  '\u6539\u6642\u9593',
  '\u6539\u6642\u6bb5',
  '\u63db\u6642\u9593',
  '\u63db\u6642\u6bb5',
  '\u6539\u5230',
  'reschedule',
];

const bookingKeywords = [
  '\u6211\u8981\u9810\u7d04',
  '\u5e6b\u6211\u9810\u7d04',
  '\u9810\u7d04\u9019\u500b',
  '\u6211\u8981\u9019\u500b\u6642\u6bb5',
  '\u9810\u7d04',
  '\u5831\u540d',
  'book',
  'reserve',
];

const availabilityKeywords = [
  '\u4eca\u665a',
  '\u4eca\u5929',
  '\u660e\u5929',
  '\u6642\u6bb5',
  '\u6709\u6c92\u6709\u8ab2',
  '\u9084\u6709\u8ab2\u55ce',
  '\u9084\u6709\u6642\u6bb5\u55ce',
  '\u53ef\u4ee5\u9810\u7d04\u55ce',
  '\u53ef\u9810\u7d04',
  '\u7a7a\u4f4d',
  '\u540d\u984d',
  '\u5718\u9ad4\u71c3\u8102\u8ab2',
  '\u4e00\u5c0d\u4e00\u6559\u7df4\u8ab2',
  '\u65b0\u624b\u9ad4\u9a57\u8a13\u7df4',
  'availability',
  'available',
  'schedule',
  'slot',
];

const faqKeywords = [
  '\u71df\u696d\u6642\u9593',
  '\u71df\u696d',
  '\u5e7e\u9ede',
  '\u6536\u8cbb',
  '\u50f9\u683c',
  '\u8cbb\u7528',
  '\u505c\u8eca',
  '\u6dcb\u6d74',
  '\u6d17\u6fa1',
  '\u66f4\u8863\u5ba4',
  '\u65b0\u624b',
  '\u7b2c\u4e00\u6b21',
  '\u5730\u5740',
  '\u5728\u54ea',
  'policy',
  'price',
  'parking',
  'hours',
  'shower',
];

const greetingKeywords = [
  '\u4f60\u597d',
  '\u54c8\u56c9',
  '\u55e8',
  'hello',
  'hi',
  '\u65e9\u5b89',
  '\u665a\u5b89',
];

function includesAnyKeyword(message: string, keywords: string[]): boolean {
  return keywords.some((keyword) => message.includes(normalizeMessageText(keyword)));
}

export function detectIntent(message: string): IntentName {
  const normalized = normalizeMessageText(message);

  if (!normalized) {
    return 'UNKNOWN';
  }

  if (includesAnyKeyword(normalized, handoffKeywords)) {
    return 'HANDOFF';
  }

  if (includesAnyKeyword(normalized, cancelKeywords)) {
    return 'CANCEL';
  }

  if (includesAnyKeyword(normalized, rescheduleKeywords)) {
    return 'RESCHEDULE';
  }

  if (includesAnyKeyword(normalized, bookingKeywords)) {
    return 'BOOKING';
  }

  if (includesAnyKeyword(normalized, availabilityKeywords)) {
    return 'AVAILABILITY';
  }

  if (includesAnyKeyword(normalized, faqKeywords)) {
    return 'FAQ';
  }

  if (normalized.length <= 8 && includesAnyKeyword(normalized, greetingKeywords)) {
    return 'GREETING';
  }

  return 'UNKNOWN';
}
