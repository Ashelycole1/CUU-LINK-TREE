/**
 * Placeholder shapes shown while a public page loads, laid out like the real
 * page so nothing jumps when the content arrives. Screen readers hear one
 * "Loading" message instead of the shapes.
 */
export function PageSkeleton({ variant }: { variant: "tree" | "event" }) {
  return (
    <div className="skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="tree-column" aria-hidden="true">
        {variant === "tree" ? (
          <>
            <div className="skeleton-header">
              <span className="skel skel-avatar" />
              <span className="skel skel-line" style={{ width: "46%", height: 22 }} />
              <span className="skel skel-line" style={{ width: "28%" }} />
              <span className="skel skel-line" style={{ width: "70%" }} />
            </div>
            <div className="skeleton-list">
              {[0, 1, 2].map((i) => (
                <span key={i} className="skel skel-ticket" />
              ))}
            </div>
          </>
        ) : (
          <>
            <span className="skel skel-cover" />
            <div className="skeleton-header">
              <span className="skel skel-line" style={{ width: "24%" }} />
              <span className="skel skel-line" style={{ width: "62%", height: 28 }} />
              <span className="skel skel-line" style={{ width: "40%" }} />
            </div>
            <div className="skeleton-list">
              <span className="skel skel-ticket" />
              <span className="skel skel-ticket" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
