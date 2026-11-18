import { useId, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  hint?: ReactNode;
}

/** A password input with a show/hide button, so people can check what they typed on a phone keyboard. */
export function PasswordField({ label, value, onChange, autoComplete, minLength, hint }: Props) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          aria-controls={id}
        >
          <Icon name={shown ? "eyeOff" : "eye"} size={20} />
        </button>
      </div>
      {hint && (
        <small id={hintId} className="hint">
          {hint}
        </small>
      )}
    </div>
  );
}
