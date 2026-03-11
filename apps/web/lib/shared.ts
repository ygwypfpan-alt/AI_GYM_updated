export const DEFAULT_BUSINESS_SLUG = 'ai-gym-demo';
export const DEFAULT_TIMEZONE = 'Asia/Taipei';

export type QuickReply = {
  label: string;
  kind: 'message' | 'service' | 'handoff';
  value: string;
  serviceId?: string;
};

export type ServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
};

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  serviceId: string;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
  capacity: number;
  remainingCapacity: number;
};

export type FaqItemDto = {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  keywords: string[];
};

export type BookingDto = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  serviceId: string;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  cancellationReason: string | null;
};

export type ChatResponse = {
  conversationId: string;
  customerId: string | null;
  intent: string;
  reply: string;
  quickReplies: QuickReply[];
  faqItems: FaqItemDto[];
  suggestedServices: ServiceSummary[];
  suggestedSlots: AvailabilitySlot[];
  handoffRequestId: string | null;
};

export type ConversationSummary = {
  id: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  startedAt: string;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  messageCount: number;
};

export type HandoffRequestSummary = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string | null;
  phone: string | null;
  note: string | null;
  conversationId: string | null;
};

export type DashboardData = {
  business: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  counts: {
    bookings: number;
    faqItems: number;
    conversations: number;
    handoffRequests: number;
  };
  bookings: BookingDto[];
  faqItems: FaqItemDto[];
  conversations: ConversationSummary[];
  handoffRequests: HandoffRequestSummary[];
  services: ServiceSummary[];
  staff: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
};

export type AdminLoginResult = {
  token: string;
};

export type AdminMeResult = {
  username: string;
};

export type BookingLookupResult = {
  items: BookingDto[];
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccess<T> {
  return response.success;
}

export function formatDateTimeDisplay(
  isoString: string,
  timeZone = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date(isoString));
}

export function formatCurrencyTwd(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || value === 0) {
    return '免費';
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(value);
}
