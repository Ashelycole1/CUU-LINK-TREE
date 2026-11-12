import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/brand/Logo";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <form onSubmit={submit} className="auth-form">
          <h1>Welcome back</h1>
          <p>Log in to edit your events and see who's looking.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-dark btn-block" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        {import.meta.env.DEV && (
          <p className="demo-hint">
            Local demo: <code>buildersmeetup@demo.eventtree.test</code> with password <code>demo-password</code>, after{" "}
            <code>npm run seed</code>.
          </p>
        )}
        <p className="auth-switch">
          New here? <Link to="/signup">Claim your page</Link>
        </p>
      </div>
    </div>
  );
}
