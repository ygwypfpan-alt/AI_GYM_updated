import Link from 'next/link';

import { ChatWidget } from '../components/chat-widget';
import { FaqPanel } from '../components/faq-panel';
import { MyBookings } from '../components/my-bookings';
import { ServiceCatalog } from '../components/service-catalog';
import { PUBLIC_API_HEALTH_URL } from '../lib/public-env';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <span className="eyebrow">AI GYM Demo Release</span>
          <h1>3-minute gym booking demo</h1>
          <p className="hero-text">
            Show the booking assistant, the direct &quot;my bookings&quot;
            management flow, and the protected admin dashboard without changing
            demo data by hand.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/admin" className="button button-secondary">
            Open admin
          </Link>
          <a
            className="button"
            href={PUBLIC_API_HEALTH_URL}
            target="_blank"
            rel="noreferrer"
          >
            API health
          </a>
        </div>
      </section>

      <section className="grid-two">
        <article className="card">
          <h2>Demo flow</h2>
          <ol className="ordered-list">
            <li>Ask a FAQ or class question in chat.</li>
            <li>Book a suggested slot.</li>
            <li>Use lookup to find that booking by phone + email.</li>
            <li>Reschedule once and cancel once.</li>
            <li>Open admin and confirm the updates.</li>
          </ol>
        </article>

        <article className="card">
          <h2>Demo shortcuts</h2>
          <ul className="bullet-list">
            <li>Lookup seed: `0911111111 / ming@example.com`</li>
            <li>Admin seed: root `.env` credentials</li>
            <li>Reset demo data with `pnpm demo:reset`</li>
            <li>Admin route: `/admin`</li>
            <li>Health route: {PUBLIC_API_HEALTH_URL}</li>
          </ul>
        </article>
      </section>

      <section className="content-grid">
        <div className="stack">
          <ServiceCatalog />
          <FaqPanel />
          <MyBookings />
        </div>

        <ChatWidget />
      </section>
    </main>
  );
}
