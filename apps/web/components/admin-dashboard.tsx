'use client';

import { useEffect, useState } from 'react';

import {
  DEFAULT_BUSINESS_SLUG,
  formatDateTimeDisplay,
  isApiSuccess,
  type DashboardData,
} from '@ai-gym/shared';

import { apiFetch } from '../lib/api';

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<DashboardData>(
        `/api/admin/dashboard?businessSlug=${DEFAULT_BUSINESS_SLUG}`,
      );

      if (isApiSuccess(response)) {
        setDashboard(response.data);
      } else {
        setError(response.error);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : '載入後台資料失敗',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <section className="stack">
      <div className="card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h2>資料總覽</h2>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadDashboard()}
          >
            重新整理
          </button>
        </div>

        {loading ? <p className="muted-text">正在載入資料...</p> : null}
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
              {dashboard.business.name} · {dashboard.business.slug} ·{' '}
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
                <th>時間</th>
                <th>課程</th>
                <th>客戶</th>
                <th>教練</th>
                <th>狀態</th>
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
                  <td>{booking.staffName ?? '待安排'}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}

              {dashboard && !dashboard.bookings.length ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    目前沒有 bookings
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
                <th>問題</th>
                <th>答案</th>
                <th>關鍵字</th>
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
                    目前沒有 FAQ
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
                <th>開始時間</th>
                <th>客戶</th>
                <th>狀態</th>
                <th>最後訊息</th>
                <th>訊息數</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{formatDateTimeDisplay(conversation.startedAt)}</td>
                  <td>{conversation.customerName ?? '匿名訪客'}</td>
                  <td>{conversation.status}</td>
                  <td>{conversation.lastMessageText ?? '-'}</td>
                  <td>{conversation.messageCount}</td>
                </tr>
              ))}

              {dashboard && !dashboard.conversations.length ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    目前沒有 conversations
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
                <th>建立時間</th>
                <th>姓名</th>
                <th>電話</th>
                <th>狀態</th>
                <th>備註</th>
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
                    目前沒有 handoff requests
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
