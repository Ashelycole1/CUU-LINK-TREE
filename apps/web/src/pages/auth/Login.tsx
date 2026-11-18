import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError, EMAIL_NOT_VERIFIED, type MeDTO } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/brand/Logo";
import { AuthShowcase } from "../../components/auth/AuthShowcase";
import { VerifyEmailForm } from "../../components/auth/VerifyEmailForm";
import { PasswordField } from "../../components/ui/PasswordField";

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Signed up before but never picked a username: finish that first.
  const open = (me: MeDTO) => navigate(me.user ? from : "/signup", { replace: true });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      open(await signIn({ email, password }));
    } catch (err) {
      // Never entered the sign-up code: Neon Auth has just emailed a new one.
      if (err instanceof ApiError && err.code === EMAIL_NOT_VERIFIED) return setVerifying(true);
      setError(err instanceof ApiError ? err.message : "Couldn't log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        {verifying ? (
          <VerifyEmailForm email={email} onVerified={open} onBack={() => setVerifying(false)} />
        ) : (
        <form onSubmit={submit} className="auth-form">
          <h1>Welcome back</h1>
          <p>Log in to edit your events and see who's looking.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
          </label>
          <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        )}
        <p className="auth-switch">
          New here? <Link to="/signup">Claim your page</Link>
        </p>
      </div>
      <AuthShowcase caption="Your page keeps itself current. Upcoming events up top, past ones filed with their photos and reviews." />
    </div>
  );
}
