import type { RatingSummaryDTO } from "@event-tree/api-client";
import { Stars } from "../../ui/Art";
import { Icon } from "../../ui/Icon";

/** The average, its stars, and a bar per star level (5 down to 1). */
export function RatingBars({ summary }: { summary: RatingSummaryDTO }) {
  const max = Math.max(1, ...summary.distribution);
  return (
    <div className="rating-summary">
      <div className="rating-big">
        <b>{summary.count ? summary.average.toFixed(1) : "–"}</b>
        <Stars value={summary.average} className="stars" />
        <small>
          {summary.count} review{summary.count === 1 ? "" : "s"}
        </small>
      </div>
      <ol className="bars" aria-label="Ratings by star">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = summary.distribution[stars - 1] ?? 0;
          return (
            <li key={stars}>
              <span className="bar-label">
                {stars}
                <Icon name="star" size={12} />
                <span className="sr-only"> stars</span>
              </span>
              <span className="bar">
                <span style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span>{n}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
