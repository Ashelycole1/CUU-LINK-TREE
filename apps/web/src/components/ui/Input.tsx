import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** Fixed text before the value, e.g. "eventlink.ashelycole.dev/". */
  prefix?: string;
  hint?: ReactNode;
  error?: string | null;
  /** Shown at the right edge, e.g. an availability check icon. */
  trailing?: ReactNode;
};

/** 48px single-line input on --surface, white focus outline, optional fixed prefix. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, prefix, hint, error, trailing, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={["ui-field", className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <div className={`ui-input${error ? " has-error" : ""}`}>
        {prefix && (
          <span className="ui-input-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
        {trailing}
      </div>
      {error && <InlineError id={errorId}>{error}</InlineError>}
      {hint && !error && (
        <p id={hintId} className="ui-hint">
          {hint}
        </p>
      )}
    </div>
  );
});

/** Inline alert row: danger text with an icon, no box. */
export function InlineError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="form-error" role="alert">
      <Icon name="alert" size={16} />
      <span>{children}</span>
    </p>
  );
}
