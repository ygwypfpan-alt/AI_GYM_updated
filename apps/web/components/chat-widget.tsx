'use client';

import { useEffect, useRef, useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  formatDateTimeDisplay,
  isApiSuccess,
  type AvailabilitySlot,
  type BookingDto,
  type ChatResponse,
  type FaqItemDto,
  type QuickReply,
  type ServiceSummary,
} from '../lib/shared';

import { apiFetch } from '../lib/api';

type UiMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  quickReplies?: QuickReply[];
  services?: ServiceSummary[];
  faqs?: FaqItemDto[];
  slots?: AvailabilitySlot[];
  slotMode?: 'book' | 'reschedule';
};

const demoPrompts = [
  '今晚還有團體燃脂課嗎？',
  '請問營業時間是幾點到幾點？',
  '我要真人協助',
];

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const initialMessage: UiMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  text: '你好！我是 AI 預約助手。你可以直接問我 FAQ、時段、預約、改期、取消，或要求轉真人。',
  quickReplies: [
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
      value: '我要真人協助',
    },
  ],
};

export function ChatWidget() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [messages, setMessages] = useState<UiMessage[]>([initialMessage]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingDto | null>(null);
  const [customer, setCustomer] = useState({
    name: 'Demo 使用者',
    phone: '0900000000',
    email: 'demo@example.com',
  });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const slotActionPendingRef = useRef(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await apiFetch<{ services: ServiceSummary[] }>(
          `/api/services?businessSlug=${DEFAULT_BUSINESS_SLUG}`,
        );

        if (isApiSuccess(response)) {
          setServices(response.data.services);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    }

    void loadServices();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function appendMessage(message: UiMessage) {
    setMessages((current) => [...current, message]);
  }

  function assistantMessage(
    text: string,
    extras?: Partial<Omit<UiMessage, 'id' | 'role' | 'text'>>,
  ): UiMessage {
    return {
      id: createId(),
      role: 'assistant',
      text,
      ...extras,
    };
  }

  function mapChatResponseToMessage(data: ChatResponse): UiMessage {
    return assistantMessage(data.reply, {
      quickReplies: data.quickReplies,
      services: data.suggestedServices,
      faqs: data.faqItems,
      slots: data.suggestedSlots,
      slotMode: data.suggestedSlots.length > 0 ? 'book' : undefined,
    });
  }

  async function sendChat(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    appendMessage({
      id: createId(),
      role: 'user',
      text: trimmed,
    });

    setInput('');
    setLoading(true);

    try {
      const response = await apiFetch<ChatResponse>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          businessSlug: DEFAULT_BUSINESS_SLUG,
          conversationId,
          customer,
          message: trimmed,
        }),
      });

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`發生錯誤：${response.error}`));
        return;
      }

      setConversationId(response.data.conversationId);
      appendMessage(mapChatResponseToMessage(response.data));
    } catch (error) {
      appendMessage(
        assistantMessage(
          error instanceof Error ? error.message : '送出聊天訊息失敗。',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function showAvailability(
    serviceId: string,
    slotMode: 'book' | 'reschedule',
    announce?: string,
  ) {
    if (announce) {
      appendMessage({
        id: createId(),
        role: 'user',
        text: announce,
      });
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        businessSlug: DEFAULT_BUSINESS_SLUG,
        serviceId,
        days: '7',
      });

      if (slotMode === 'reschedule' && currentBooking) {
        params.set('excludeBookingId', currentBooking.id);
      }

      const response = await apiFetch<{
        service: ServiceSummary;
        slots: AvailabilitySlot[];
      }>(`/api/availability?${params.toString()}`);

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`發生錯誤：${response.error}`));
        return;
      }

      const label =
        slotMode === 'reschedule'
          ? `這裡是 ${response.data.service.name} 可改期的時段：`
          : `這裡是 ${response.data.service.name} 最近可預約時段：`;

      appendMessage(
        assistantMessage(label, {
          slots: response.data.slots,
          slotMode,
        }),
      );
    } catch (error) {
      appendMessage(
        assistantMessage(
          error instanceof Error ? error.message : '查詢時段失敗。',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function bookSlot(slot: AvailabilitySlot) {
    if (loading || slotActionPendingRef.current) {
      return;
    }

    if (!customer.name.trim()) {
      appendMessage(assistantMessage('建立預約前請先填寫姓名。'));
      return;
    }

    slotActionPendingRef.current = true;
    setLoading(true);

    try {
      const response = await apiFetch<{
        booking: BookingDto;
        message: string;
      }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          businessSlug: DEFAULT_BUSINESS_SLUG,
          serviceId: slot.serviceId,
          staffId: slot.staffId,
          slotStartAt: slot.startAt,
          conversationId,
          customer,
        }),
      });

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`預約失敗：${response.error}`));
        return;
      }

      setCurrentBooking(response.data.booking);
      appendMessage(
        assistantMessage(
          `預約成功！\n課程：${response.data.booking.serviceName}\n時間：${formatDateTimeDisplay(
            response.data.booking.startAt,
          )}\n教練：${response.data.booking.staffName ?? '待安排'}\n你現在可以直接在下方按「改期」或「取消預約」。`,
        ),
      );
    } catch (error) {
      appendMessage(
        assistantMessage(
          error instanceof Error ? error.message : '建立預約失敗。',
        ),
      );
    } finally {
      slotActionPendingRef.current = false;
      setLoading(false);
    }
  }

  async function rescheduleSlot(
    slot: AvailabilitySlot,
    slotIndex: number,
    slots: AvailabilitySlot[],
  ) {
    if (loading || slotActionPendingRef.current) {
      return;
    }
    if (!currentBooking) {
      appendMessage(assistantMessage('目前沒有可改期的 booking。'));
      return;
    }

    slotActionPendingRef.current = true;
    setLoading(true);

    try {
      const payload = {
        slotStartAt: slot.startAt,
        staffId: slot.staffId,
      };

      console.log('[reschedule-click]', {
        renderedLabel: slot.label,
        renderedStartAt: slot.startAt,
        renderedEndAt: slot.endAt,
        slotIndex,
        resolvedIndex: slots.findIndex(
          (candidate) =>
            candidate.startAt === slot.startAt &&
            (candidate.staffId ?? null) === (slot.staffId ?? null),
        ),
        payload,
      });

      const response = await apiFetch<{
        booking: BookingDto;
        message: string;
      }>(`/api/bookings/${currentBooking.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`改期失敗：${response.error}`));
        return;
      }

      console.log('[reschedule-response]', {
        renderedLabel: slot.label,
        payload,
        bookingStartAt: response.data.booking.startAt,
        bookingEndAt: response.data.booking.endAt,
      });

      setCurrentBooking(response.data.booking);
      appendMessage(
        assistantMessage(
          `改期成功！新的時間是 ${formatDateTimeDisplay(
            response.data.booking.startAt,
          )}。`,
        ),
      );
    } catch (error) {
      appendMessage(
        assistantMessage(error instanceof Error ? error.message : '改期失敗。'),
      );
    } finally {
      slotActionPendingRef.current = false;
      setLoading(false);
    }
  }

  async function cancelCurrentBooking() {
    if (!currentBooking) {
      appendMessage(assistantMessage('目前沒有可取消的 booking。'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch<{
        booking: BookingDto;
        message: string;
      }>(`/api/bookings/${currentBooking.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: '使用者於網站聊天視窗取消',
        }),
      });

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`取消失敗：${response.error}`));
        return;
      }

      setCurrentBooking(response.data.booking);
      appendMessage(
        assistantMessage(
          `已取消預約：${response.data.booking.serviceName} (${formatDateTimeDisplay(
            response.data.booking.startAt,
          )})。`,
        ),
      );
    } catch (error) {
      appendMessage(
        assistantMessage(error instanceof Error ? error.message : '取消失敗。'),
      );
    } finally {
      setLoading(false);
    }
  }

  async function requestHandoff(note: string) {
    setLoading(true);

    try {
      const response = await apiFetch<{
        message: string;
      }>('/api/handoff-requests', {
        method: 'POST',
        body: JSON.stringify({
          businessSlug: DEFAULT_BUSINESS_SLUG,
          conversationId,
          customer,
          note,
        }),
      });

      if (!isApiSuccess(response)) {
        appendMessage(assistantMessage(`轉真人失敗：${response.error}`));
        return;
      }

      appendMessage(assistantMessage(response.data.message));
    } catch (error) {
      appendMessage(
        assistantMessage(
          error instanceof Error ? error.message : '轉真人請求失敗。',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleQuickReply(reply: QuickReply) {
    if (reply.kind === 'message') {
      void sendChat(reply.value);
      return;
    }

    if (reply.kind === 'service' && reply.serviceId) {
      void showAvailability(reply.serviceId, 'book', `我想看 ${reply.label} 時段`);
      return;
    }

    if (reply.kind === 'handoff') {
      void requestHandoff(reply.value);
    }
  }

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <div>
          <span className="eyebrow">Chat</span>
          <h2>聊天視窗</h2>
        </div>
        <span className="status-pill">
          {loading ? '處理中...' : '可直接 demo'}
        </span>
      </header>

      <div className="card subdued">
        <h3>Demo 使用者資料</h3>
        <div className="form-grid">
          <label>
            姓名
            <input
              value={customer.name}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label>
            電話
            <input
              value={customer.phone}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>
          <label className="full-span">
            Email
            <input
              value={customer.email}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className="prompt-row">
        {demoPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chip-button"
            onClick={() => void sendChat(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-log">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`message-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <p>{message.text}</p>

            {message.quickReplies?.length ? (
              <div className="chip-row top-gap">
                {message.quickReplies.map((reply) => (
                  <button
                    key={`${message.id}-${reply.label}`}
                    type="button"
                    className="chip-button"
                    disabled={loading}
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            ) : null}

            {message.services?.length ? (
              <div className="list-stack top-gap">
                {message.services.map((service) => (
                  <button
                    key={`${message.id}-${service.id}`}
                    type="button"
                    className="selection-card"
                    disabled={loading}
                    onClick={() =>
                      void showAvailability(
                        service.id,
                        'book',
                        `我想看 ${service.name} 時段`,
                      )
                    }
                  >
                    <strong>{service.name}</strong>
                    <span>
                      {service.durationMinutes} 分鐘 ·{' '}
                      {service.price === null || service.price === 0
                        ? '免費'
                        : `${service.price} 元`}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {message.faqs?.length ? (
              <div className="list-stack top-gap">
                {message.faqs.map((faq) => (
                  <div key={`${message.id}-${faq.id}`} className="inline-card">
                    <strong>{faq.question}</strong>
                    <span>{faq.answer}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {message.slots?.length ? (
              <div className="list-stack top-gap">
                {message.slots.map((slot, slotIndex) => (
                  <button
                    key={`${message.id}-${slot.startAt}-${slot.staffId ?? 'na'}`}
                    type="button"
                    className="selection-card"
                    disabled={loading}
                    onClick={() =>
                      message.slotMode === 'reschedule'
                        ? void rescheduleSlot(slot, slotIndex, message.slots ?? [])
                        : void bookSlot(slot)
                    }
                  >
                    <strong>{slot.label}</strong>
                    <span className="inline-small">
                      startAt: {slot.startAt} | index: {slotIndex}
                    </span>
                    <span>
                      {slot.staffName ?? '待安排教練'} · 剩餘名額 {slot.remainingCapacity}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}

        {loading ? <div className="typing-indicator">AI 助手處理中...</div> : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void sendChat(input);
        }}
      >
        <input
          className="chat-input"
          placeholder="輸入訊息，例如：今晚還有團體燃脂課嗎？"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="button" type="submit" disabled={loading}>
          送出
        </button>
      </form>

      <div className="card subdued">
        <h3>目前預約</h3>
        {currentBooking ? (
          <div className="booking-card">
            <p>
              <strong>{currentBooking.serviceName}</strong>
            </p>
            <p>狀態：{currentBooking.status}</p>
            <p>時間：{formatDateTimeDisplay(currentBooking.startAt)}</p>
            <p>教練：{currentBooking.staffName ?? '待安排'}</p>
            <div className="chip-row">
              <button
                type="button"
                className="button button-secondary"
                disabled={loading || currentBooking.status === 'CANCELLED'}
                onClick={() =>
                  void showAvailability(
                    currentBooking.serviceId,
                    'reschedule',
                    '我想改期',
                  )
                }
              >
                改期
              </button>
              <button
                type="button"
                className="button button-danger"
                disabled={loading || currentBooking.status === 'CANCELLED'}
                onClick={() => void cancelCurrentBooking()}
              >
                取消預約
              </button>
            </div>
          </div>
        ) : (
          <p className="muted-text">
            先在上方聊天選時段，建立 booking 後就能在這裡直接改期或取消。
          </p>
        )}
      </div>

      <div className="chip-row">
        {services.map((service) => (
          <button
            key={`service-shortcut-${service.id}`}
            type="button"
            className="chip-button"
            onClick={() =>
              void showAvailability(service.id, 'book', `我想看 ${service.name} 時段`)
            }
          >
            {service.name}
          </button>
        ))}
      </div>
    </section>
  );
}
