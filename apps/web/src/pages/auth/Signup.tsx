import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, EMAIL_NOT_VERIFIED } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/brand/Logo";
import { VerifyEmailForm } from "../../components/auth/VerifyEmailForm";
import { api } from "../../lib/api";

type Availability = { state: "idle" | "checking" | "ok" | "bad"; message?: string };

/**
 * Two steps, like claiming a name on Linktree: pick a username, then create
 * the account (Neon Auth). Someone already signed in without a page only
 * needs the first step.
 */
export function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { identity, user, checking, signUp, claim, logout } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState(params.get("username") ?? "");
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Check the name as the host types, after a short pause.
  useEffect(() => {
    const name = username.trim().toLowerCase();
    if (!name) return setAvailability({ state: "idle" });
    setAvailability({ state: "checking" });
    const id = window.setTimeout(async () => {
      try {
        const r = await api.checkUsername(name);
        setAvailability(r.available ? { state: "ok", message: `${window.location.host}/${r.username} is yours to claim.` } : { state: "bad", message: r.reason });
      } catch {
        setAvailability({ state: "bad", message: "Couldn't check that name. Try again." });
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [username]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step === 1 && !identity) {
      if (availability.state === "ok") setStep(2);
      return;
    }
    setBusy(true);
    setError("");
    try {
      // A failed claim after sign-up leaves them signed in; they come back here to pick another name.
      if (!identity) await signUp({ email, password, name: displayName.trim() || username });
      await claimAndOpen();
    } catch (err) {
      // The account exists; the emailed code comes next.
      if (err instanceof ApiError && err.code === EMAIL_NOT_VERIFIED) return setStep(3);
      setError(err instanceof ApiError ? err.message : "Couldn't create your page.");
      if (err instanceof ApiError && err.field === "username") setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function claimAndOpen() {
    const name = displayName.trim();
    await claim({ username, displayName: name || undefined });
    navigate("/admin");
  }

  if (checking) return <p className="loading-note">Loading…</p>;
  if (user) return <Navigate to="/admin" replace />;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        {step === 3 && !identity ? (
          <VerifyEmailForm
            email={email}
            onVerified={async () => {
              try {
                await claimAndOpen();
              } catch (err) {
                // Signed in now: back to picking a name if that one was taken meanwhile.
                setError(err instanceof ApiError ? err.message : "Couldn't create your page.");
                setStep(1);
              }
            }}
            onBack={() => setStep(2)}
          />
        ) : step === 1 || identity ? (
          <form onSubmit={submit} className="auth-form">
            <h1>Claim your page</h1>
            <p>Pick the name people will see in your link. You can't change it later.</p>
            <label className="claim-field claim-field--boxed">
              <span className="claim-host">{window.location.host}/</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="yourname"
                autoFocus
                autoCapitalize="none"
                spellCheck={false}
                aria-label="Username"
                aria-describedby="username-status"
              />
            </label>
            <p id="username-status" className={`field-status ${availability.state}`} aria-live="polite">
              {availability.state === "checking" ? "Checking…" : availability.message}
            </p>
            {identity && (
              <label>
                Page name
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. City Jazz Nights" maxLength={60} />
              </label>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-dark btn-block" disabled={availability.state !== "ok" || busy}>
              {identity ? (busy ? "Creating your page…" : "Create my page") : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <h1>Create your account</h1>
            <p>
              Your page will be at <b>{window.location.host}/{username.toLowerCase()}</b>.{" "}
              <button type="button" className="text-btn" onClick={() => setStep(1)}>
                Change
              </button>
            </p>
            <label>
              Page name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. City Jazz Nights" maxLength={60} />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              <small>At least 8 characters.</small>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-dark btn-block" disabled={busy}>
              {busy ? "Creating your page…" : "Create account"}
            </button>
          </form>
        )}
        {identity ? (
          <p className="auth-switch">
            Signed in as {identity.email}.{" "}
            <button type="button" className="text-btn" onClick={() => void logout()}>
              Log out
            </button>
          </p>
        ) : (
          <p className="auth-switch">
            Already have a page? <Link to="/login">Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
