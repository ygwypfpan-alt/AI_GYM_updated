'use client';

type AdminLoginProps = {
  loading: boolean;
  error: string | null;
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function AdminLogin(props: AdminLoginProps) {
  return (
    <section className="stack">
      <section className="hero-card compact">
        <div>
          <span className="eyebrow">Admin Access</span>
          <h1>Admin login</h1>
          <p className="hero-text">
            Sign in with the env-based admin account before viewing dashboard
            data.
          </p>
        </div>
      </section>

      <section className="card auth-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Login</span>
            <h2>Use the admin credentials from `.env`</h2>
          </div>
        </div>

        <p className="muted-text">
          Use `ADMIN_USERNAME` and `ADMIN_PASSWORD` from the root `.env` file.
        </p>

        <div className="form-grid">
          <label>
            Username
            <input
              value={props.username}
              onChange={(event) => props.onUsernameChange(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={props.password}
              onChange={(event) => props.onPasswordChange(event.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {props.error ? <p className="error-text top-gap">{props.error}</p> : null}

        <div className="top-gap">
          <button
            type="button"
            className="button"
            disabled={props.loading}
            onClick={props.onSubmit}
          >
            {props.loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </section>
    </section>
  );
}
