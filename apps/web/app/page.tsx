import Link from 'next/link';

import { ChatWidget } from '../components/chat-widget';
import { FaqPanel } from '../components/faq-panel';
import { MyBookings } from '../components/my-bookings';
import { ServiceCatalog } from '../components/service-catalog';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <span className="eyebrow">AI GYM MVP Demo</span>
          <h1>AI booking assistant for a gym demo</h1>
          <p className="hero-text">
            This repo now supports chat-driven booking plus a direct "my
            bookings" management flow and a protected admin login.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/admin" className="button button-secondary">
            Open admin
          </Link>
          <a
            className="button"
            href="http://localhost:3001/health"
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
            <li>Ask for a class in chat.</li>
            <li>Book a suggested slot.</li>
            <li>Use the new lookup form to find that booking.</li>
            <li>Reschedule once and cancel once.</li>
            <li>Open admin and confirm the data updates.</li>
          </ol>
        </article>

        <article className="card">
          <h2>Current scope</h2>
          <ul className="bullet-list">
            <li>Chat FAQ and booking demo</li>
            <li>Booking lookup by phone + email</li>
            <li>Reschedule and cancel from lookup results</li>
            <li>Minimal admin login with JWT</li>
            <li>Protected admin dashboard API</li>
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
