'use client';

import { useEffect, useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  formatDateTimeDisplay,
  isApiSuccess,
  type DashboardData,
} from '../lib/shared';

import { apiFetch } from '../lib/api';

type AdminDashboardProps = {
  token: string;
  onUnauthorized?: () => void;
};

export function AdminDashboard({ token, onUnauthorized }: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<DashboardData>(
        `/api/admin/dashboard?businessSlug=${DEFAULT_BUSINESS_SLUG}`,
        undefined,
        token,
      );

      if (isApiSuccess(response)) {
        setDashboard(response.data);
      } else {
        if (response.error === 'Unauthorized.') {
          onUnauthorized?.();
        }
        setError(response.error);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  return (
    <section className="stack">
      <div className="card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h2>Operational summary</h2>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadDashboard()}
          >
            Refresh
          </button>
        </div>

        {loading ? <p className="muted-text">Loading dashboard data...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {dashboard ? (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <span>Bookings</span>
                <strong>{dashboard.counts.bookings}</strong>
              </article>
              <article className="stat-card">
                <span>FAQ Items</span>
                <strong>{dashboard.counts.faqItems}</strong>
              </article>
              <article className="stat-card">
                <span>Conversations</span>
                <strong>{dashboard.counts.conversations}</strong>
              </article>
              <article className="stat-card">
                <span>Handoff Requests</span>
                <strong>{dashboard.counts.handoffRequests}</strong>
              </article>
            </div>

            <p className="muted-text">
              {dashboard.business.name} | {dashboard.business.slug} |{' '}
              {dashboard.business.timezone}
            </p>
          </>
        ) : null}
      </div>

      <div className="card">
        <h2>Bookings</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Service</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{formatDateTimeDisplay(booking.startAt)}</td>
                  <td>{booking.serviceName}</td>
                  <td>
                    {booking.customerName}
                    <br />
                    <span className="muted-text inline-small">
                      {booking.customerPhone ?? '-'}
                    </span>
                  </td>
                  <td>{booking.staffName ?? 'TBD'}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}

              {dashboard && !dashboard.bookings.length ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    No bookings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>FAQ Items</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Keywords</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.faqItems.map((faq) => (
                <tr key={faq.id}>
                  <td>{faq.question}</td>
                  <td>{faq.answer}</td>
                  <td>{faq.keywords.join(', ')}</td>
                </tr>
              ))}

              {dashboard && !dashboard.faqItems.length ? (
                <tr>
                  <td colSpan={3} className="muted-text">
                    No FAQ items yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Conversations</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Started</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Last message</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{formatDateTimeDisplay(conversation.startedAt)}</td>
                  <td>{conversation.customerName ?? 'Anonymous'}</td>
                  <td>{conversation.status}</td>
                  <td>{conversation.lastMessageText ?? '-'}</td>
                  <td>{conversation.messageCount}</td>
                </tr>
              ))}

              {dashboard && !dashboard.conversations.length ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    No conversations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Handoff Requests</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.handoffRequests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDateTimeDisplay(request.createdAt)}</td>
                  <td>{request.customerName ?? '-'}</td>
                  <td>{request.phone ?? '-'}</td>
                  <td>{request.status}</td>
                  <td>{request.note ?? '-'}</td>
                </tr>
              ))}

              {dashboard && !dashboard.handoffRequests.length ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    No handoff requests yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
