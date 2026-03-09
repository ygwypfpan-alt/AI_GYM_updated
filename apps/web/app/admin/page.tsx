import Link from 'next/link';

import { AdminDashboard } from '../../components/admin-dashboard';

export default function AdminPage() {
  return (
    <main className="page-shell">
      <section className="hero-card compact">
        <div>
          <span className="eyebrow">AI GYM · Admin</span>
          <h1>基本後台管理頁</h1>
          <p className="hero-text">
            這個頁面無登入驗證，專門用來 demo 查看 bookings、FAQ、對話紀錄與轉真人請求。
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/" className="button button-secondary">
            回首頁 Demo
          </Link>
        </div>
      </section>

      <AdminDashboard />
    </main>
  );
}
