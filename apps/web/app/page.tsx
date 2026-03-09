import Link from 'next/link';

import { ChatWidget } from '../components/chat-widget';
import { FaqPanel } from '../components/faq-panel';
import { ServiceCatalog } from '../components/service-catalog';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <span className="eyebrow">AI GYM · MVP Demo</span>
          <h1>健身房 AI 預約機器人</h1>
          <p className="hero-text">
            這個版本可以直接 demo FAQ、查詢可預約時段、建立預約、改期、取消，以及轉真人。
            右側聊天視窗已內建 demo 快捷流程。
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/admin" className="button button-secondary">
            前往後台管理頁
          </Link>
          <a
            className="button"
            href="http://localhost:3001/health"
            target="_blank"
            rel="noreferrer"
          >
            打開 API Health
          </a>
        </div>
      </section>

      <section className="grid-two">
        <article className="card">
          <h2>建議 demo 方式</h2>
          <ol className="ordered-list">
            <li>先在聊天輸入「今晚還有團體燃脂課嗎？」</li>
            <li>點選下方出現的可預約時段，直接建立預約</li>
            <li>建立成功後，用「改期」按鈕改到另一個時段</li>
            <li>再用「取消預約」按鈕完成取消</li>
            <li>最後輸入「我要真人協助」建立轉真人請求</li>
          </ol>
        </article>

        <article className="card">
          <h2>目前功能範圍</h2>
          <ul className="bullet-list">
            <li>網站聊天視窗</li>
            <li>規則式 FAQ 問答</li>
            <li>可預約時段查詢</li>
            <li>建立 / 改期 / 取消預約</li>
            <li>轉真人請求</li>
            <li>後台查看 bookings、faq_items、conversations、handoff_requests</li>
          </ul>
        </article>
      </section>

      <section className="content-grid">
        <div className="stack">
          <ServiceCatalog />
          <FaqPanel />
        </div>

        <ChatWidget />
      </section>
    </main>
  );
}
