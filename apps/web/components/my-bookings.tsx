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

export function MyBookings() {
  const [phone, setPhone] = useState('0911111111');
  const [email, setEmail] = useState('ming@example.com');
  const [items, setItems] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotLoadingId, setSlotLoadingId] = useState<string | null>(null);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);

  async function lookupBookings() {
    setLoading(true);
    setError(null);

    try {
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
        return;
      }

      setItems(response.data.items);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error ? lookupError.message : 'Lookup failed.',
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    setLoading(true);
    setError(null);

    try {
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
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === bookingId ? response.data.booking : item,
        ),
      );
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Cancel failed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRescheduleSlots(booking: BookingDto) {
    setSlotLoadingId(booking.id);
    setError(null);

    try {
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
        return;
      }

      setRescheduleTargetId(booking.id);
      setRescheduleSlots(response.data.slots);
    } catch (slotError) {
      setError(
        slotError instanceof Error ? slotError.message : 'Availability lookup failed.',
      );
    } finally {
      setSlotLoadingId(null);
    }
  }

  async function rescheduleBooking(bookingId: string, slot: AvailabilitySlot) {
    setLoading(true);
    setError(null);

    try {
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
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === bookingId ? response.data.booking : item,
        ),
      );
      setRescheduleTargetId(null);
      setRescheduleSlots([]);
    } catch (rescheduleError) {
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : 'Reschedule failed.',
      );
    } finally {
      setLoading(false);
    }
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
        {items.map((booking) => (
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

            <div className="hero-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={loading || booking.status === 'CANCELLED'}
                onClick={() => void loadRescheduleSlots(booking)}
              >
                {slotLoadingId === booking.id ? 'Loading slots...' : 'Reschedule'}
              </button>
              <button
                type="button"
                className="button button-danger"
                disabled={loading || booking.status === 'CANCELLED'}
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
                      <span>{slot.staffName ?? 'TBD'} | Remaining {slot.remainingCapacity}</span>
                    </button>
                  ))
                ) : (
                  <p className="muted-text">No alternate slots found.</p>
                )}
              </div>
            ) : null}
          </article>
        ))}

        {!items.length && !error ? (
          <p className="muted-text">
            Use the seeded example `0911111111 / ming@example.com` to test the
            lookup flow after setup.
          </p>
        ) : null}
      </div>
    </section>
  );
}
