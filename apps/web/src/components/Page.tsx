import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  /** Shows a back button in the top-left corner. */
  back?: boolean;
  action?: ReactNode;
}

/** Shared page frame: the 580px column and the floating 40px corner buttons. */
export function Page({ children, back, action }: Props) {
  return (
    <>
      {back && (
        <Link className="corner left" to="/" aria-label="Back to all events">
          ←
        </Link>
      )}
      {action}
      <main className="wrap">{children}</main>
    </>
  );
}

export function StatusNote({ loading, error, onRetry }: { loading: boolean; error: { message: string } | null; onRetry?: () => void }) {
  if (loading) return <p className="muted center pad">Loading…</p>;
  if (error)
    return (
      <div className="center pad">
        <p className="error">{error.message}</p>
        {onRetry && (
          <button type="button" className="chip" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  return null;
}
