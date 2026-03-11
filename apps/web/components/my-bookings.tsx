'use client';

import { useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  formatDateTimeDisplay,
  isApiSuccess,
  type AvailabilitySlot,
  type BookingDto,
  type BookingLookupResult,
} from '../lib/shared';

import { apiFetch } from '../lib/api';

function canManageBooking(booking: BookingDto): boolean {
  return (
    booking.status === 'BOOKED' && new Date(booking.startAt).getTime() > Date.now()
  );
}

export function MyBookings() {
  const [phone, setPhone] = useState('0911111111');
  const [email, setEmail] = useState('ming@example.com');
  const [items, setItems] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotLoadingId, setSlotLoadingId] = useState<string | null>(null);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  async function lookupBookings() {
    if (!phone.trim() || !email.trim()) {
      setError('Please enter both phone and email before searching.');
      setItems([]);
      return;
    }

    setLookupAttempted(true);
    setLoading(true);
    setError(null);
    setRescheduleTargetId(null);
    setRescheduleSlots([]);

    const response = await apiFetch<BookingLookupResult>('/api/bookings/lookup', {
      method: 'POST',
      body: JSON.stringify({
        businessSlug: DEFAULT_BUSINESS_SLUG,
        phone,
        email,
      }),
    });

    if (!isApiSuccess(response)) {
      setError(response.error);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(response.data.items);
    setLoading(false);
  }

  async function cancelBooking(bookingId: string) {
    setLoading(true);
    setError(null);

    const response = await apiFetch<{ booking: BookingDto; message: string }>(
      `/api/bookings/${bookingId}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          reason: 'Cancelled from my bookings lookup flow.',
        }),
      },
    );

    if (!isApiSuccess(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === bookingId ? response.data.booking : item)),
    );
    setRescheduleTargetId(null);
    setRescheduleSlots([]);
    setLoading(false);
  }

  async function loadRescheduleSlots(booking: BookingDto) {
    if (!canManageBooking(booking)) {
      setError('Only upcoming booked items can be rescheduled online.');
      return;
    }

    setSlotLoadingId(booking.id);
    setError(null);

    const params = new URLSearchParams({
      businessSlug: DEFAULT_BUSINESS_SLUG,
      serviceId: booking.serviceId,
      days: '7',
      excludeBookingId: booking.id,
    });

    const response = await apiFetch<{
      slots: AvailabilitySlot[];
    }>(`/api/availability?${params.toString()}`);

    if (!isApiSuccess(response)) {
      setError(response.error);
      setSlotLoadingId(null);
      return;
    }

    setRescheduleTargetId(booking.id);
    setRescheduleSlots(response.data.slots);
    setSlotLoadingId(null);
  }

  async function rescheduleBooking(bookingId: string, slot: AvailabilitySlot) {
    setLoading(true);
    setError(null);

    const response = await apiFetch<{ booking: BookingDto; message: string }>(
      `/api/bookings/${bookingId}/reschedule`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          slotStartAt: slot.startAt,
          staffId: slot.staffId,
        }),
      },
    );

    if (!isApiSuccess(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === bookingId ? response.data.booking : item)),
    );
    setRescheduleTargetId(null);
    setRescheduleSlots([]);
    setLoading(false);
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">My Bookings</span>
          <h2>Lookup and manage bookings</h2>
          <p className="hero-text">
            Use phone + email to find an existing booking, then reschedule or
            cancel it without using the chat flow.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      </div>

      <div className="hero-actions top-gap">
        <button
          type="button"
          className="button"
          disabled={loading}
          onClick={() => void lookupBookings()}
        >
          {loading ? 'Loading...' : 'Find my bookings'}
        </button>
      </div>

      {error ? <p className="error-text top-gap">{error}</p> : null}

      <div className="list-stack top-gap">
        {items.map((booking) => {
          const isManageable = canManageBooking(booking);

          return (
            <article key={booking.id} className="inline-card booking-manage-card">
              <div className="booking-manage-header">
                <div>
                  <strong>{booking.serviceName}</strong>
                  <p className="muted-text">
                    {formatDateTimeDisplay(booking.startAt)} | {booking.staffName ?? 'TBD'}
                  </p>
                </div>
                <span className="chip">{booking.status}</span>
              </div>

              <p className="muted-text">
                Customer: {booking.customerName} | {booking.customerPhone ?? '-'} |{' '}
                {booking.customerEmail ?? '-'}
              </p>

              {booking.cancellationReason ? (
                <p className="muted-text">Reason: {booking.cancellationReason}</p>
              ) : null}

              {!isManageable ? (
                <p className="muted-text">
                  This item is view-only because it is cancelled or already in the
                  past.
                </p>
              ) : null}

              <div className="hero-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={loading || !isManageable}
                  onClick={() => void loadRescheduleSlots(booking)}
                >
                  {slotLoadingId === booking.id ? 'Loading slots...' : 'Reschedule'}
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  disabled={loading || !isManageable}
                  onClick={() => void cancelBooking(booking.id)}
                >
                  Cancel
                </button>
              </div>

              {rescheduleTargetId === booking.id ? (
                <div className="list-stack top-gap">
                  {rescheduleSlots.length ? (
                    rescheduleSlots.map((slot) => (
                      <button
                        key={`${booking.id}-${slot.startAt}-${slot.staffId ?? 'na'}`}
                        type="button"
                        className="selection-card"
                        disabled={loading}
                        onClick={() => void rescheduleBooking(booking.id, slot)}
                      >
                        <strong>{slot.label}</strong>
                        <span>
                          {slot.staffName ?? 'TBD'} | Remaining {slot.remainingCapacity}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="muted-text">No alternate slots found.</p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}

        {!items.length && !error && !lookupAttempted ? (
          <p className="muted-text">
            Use the seeded example `0911111111 / ming@example.com` to test the
            lookup flow after setup.
          </p>
        ) : null}

        {!items.length && !error && lookupAttempted ? (
          <p className="muted-text">
            No bookings matched that phone + email combination.
          </p>
        ) : null}
      </div>
    </section>
  );
}
