'use client';

import { useEffect, useState } from 'react';

import {
  isApiSuccess,
  type AdminLoginResult,
  type AdminMeResult,
} from '@ai-gym/shared';

import { apiFetch } from '../lib/api';
import { AdminDashboard } from './admin-dashboard';
import { AdminLogin } from './admin-login';

const ADMIN_TOKEN_KEY = 'ai-gym-admin-token';

export function AdminShell() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'anonymous' | 'authenticated'>('checking');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!storedToken) {
      setStatus('anonymous');
      return;
    }

    const activeToken = storedToken;

    async function validateToken() {
      const response = await apiFetch<AdminMeResult>(
        '/api/admin/me',
        undefined,
        activeToken,
      );

      if (!isApiSuccess(response)) {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        setStatus('anonymous');
        return;
      }

      setToken(activeToken);
      setUsername(response.data.username);
      setStatus('authenticated');
    }

    void validateToken();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<AdminLoginResult>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!isApiSuccess(response)) {
        setError(response.error);
        setStatus('anonymous');
        return;
      }

      window.localStorage.setItem(ADMIN_TOKEN_KEY, response.data.token);
      setToken(response.data.token);
      setStatus('authenticated');
      setPassword('');
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Login failed.',
      );
      setStatus('anonymous');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setPassword('');
    setError(null);
    setStatus('anonymous');
  }

  if (status === 'checking') {
    return (
      <main className="page-shell">
        <section className="card">
          <p className="muted-text">Checking admin session...</p>
        </section>
      </main>
    );
  }

  if (status !== 'authenticated' || !token) {
    return (
      <main className="page-shell">
        <AdminLogin
          loading={loading}
          error={error}
          username={username}
          password={password}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={() => void handleLogin()}
        />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card compact">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Protected dashboard</h1>
          <p className="hero-text">
            Signed in as <strong>{username}</strong>. This view now uses the
            minimal JWT flow for local admin access.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </section>

      <AdminDashboard token={token} onUnauthorized={handleLogout} />
    </main>
  );
}
