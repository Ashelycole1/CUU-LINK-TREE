import { useState, type FormEvent } from "react";
import { ApiError, type MeDTO } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";

/** Asks for the code Neon Auth emailed at sign-up, then signs the person in. */
export function VerifyEmailForm({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: (me: MeDTO) => void | Promise<void>;
  onBack: () => void;
}) {
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      await onVerified(await verifyEmail({ email, otp: code.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check that code.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setNote("");
    try {
      await resendCode(email);
      setNote("We sent a new code. Check your inbox.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send a new code.");
    }
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <h1>Check your email</h1>
      <p>
        We sent a code to <b>{email}</b>. Enter it below to finish signing up.
      </p>
      <label>
        Code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          required
          autoFocus
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {note && <p className="field-status ok" aria-live="polite">{note}</p>}
      <button className="btn btn-dark btn-block" disabled={busy || code.trim().length < 4}>
        {busy ? "Checking…" : "Verify"}
      </button>
      <p className="auth-switch">
        No email? Check spam, or{" "}
        <button type="button" className="text-btn" onClick={() => void resend()}>
          send a new code
        </button>
        .{" "}
        <button type="button" className="text-btn" onClick={onBack}>
          Use a different email
        </button>
      </p>
    </form>
  );
}
