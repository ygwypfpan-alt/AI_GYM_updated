import type {
  Booking,
  Conversation,
  Customer,
  FaqItem,
  HandoffRequest,
  Message,
  Service,
  Staff,
} from '@ai-gym/db';
import type {
  BookingDto,
  ConversationSummary,
  FaqItemDto,
  HandoffRequestSummary,
  ServiceSummary,
} from '@ai-gym/shared';

export function mapServiceDto(
  service: Pick<Service, 'id' | 'name' | 'description' | 'durationMinutes' | 'price'>,
): ServiceSummary {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: service.price,
  };
}

export function mapFaqDto(
  item: Pick<FaqItem, 'id' | 'category' | 'question' | 'answer' | 'keywords'>,
): FaqItemDto {
  return {
    id: item.id,
    category: item.category,
    question: item.question,
    answer: item.answer,
    keywords: item.keywords,
  };
}

type BookingWithRelations = Booking & {
  customer: Customer;
  service: Service;
  staff: Staff | null;
};

export function mapBookingDto(booking: BookingWithRelations): BookingDto {
  return {
    id: booking.id,
    status: booking.status,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    serviceId: booking.serviceId,
    serviceName: booking.service.name,
    staffId: booking.staffId,
    staffName: booking.staff?.name ?? null,
    customerId: booking.customerId,
    customerName: booking.customer.name,
    customerPhone: booking.customer.phone ?? null,
    customerEmail: booking.customer.email ?? null,
    notes: booking.notes ?? null,
    cancellationReason: booking.cancellationReason ?? null,
  };
}

type ConversationWithRelations = Conversation & {
  customer: Customer | null;
  messages: Pick<Message, 'text' | 'createdAt'>[];
  _count: {
    messages: number;
  };
};

export function mapConversationSummary(
  conversation: ConversationWithRelations,
): ConversationSummary {
  const latestMessage = conversation.messages[0];

  return {
    id: conversation.id,
    status: conversation.status,
    customerName: conversation.customer?.name ?? null,
    customerPhone: conversation.customer?.phone ?? null,
    startedAt: conversation.startedAt.toISOString(),
    lastMessageAt: latestMessage?.createdAt.toISOString() ?? null,
    lastMessageText: latestMessage?.text ?? null,
    messageCount: conversation._count.messages,
  };
}

type HandoffRequestWithRelations = HandoffRequest & {
  customer: Customer | null;
};

export function mapHandoffRequestSummary(
  request: HandoffRequestWithRelations,
): HandoffRequestSummary {
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    customerName: request.customer?.name ?? request.name ?? null,
    phone: request.phone ?? request.customer?.phone ?? null,
    note: request.note ?? null,
    conversationId: request.conversationId ?? null,
  };
}
