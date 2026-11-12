import { useEffect, useRef, useState } from "react";
import type { AnalyticsDayDTO, AnalyticsSummaryDTO } from "@event-tree/api-client";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";

const RANGES = [7, 14, 30] as const;

/** Validated pair (scripts/validate_palette.js): blue = views, pink = clicks. */
const SERIES = [
  { key: "views", label: "Views", color: "var(--c-views)" },
  { key: "clicks", label: "Clicks", color: "var(--c-clicks)" },
] as const;

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat();
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Views, clicks and click rate for the host's page, like Linktree's Insights. */
export function AnalyticsAdmin() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(14);
  const [asTable, setAsTable] = useState(false);
  const stats = useResource(() => api.getAnalytics(days), [days]);
  const s = stats.data;

  return (
    <div className="analytics-admin">
      <div className="admin-heading">
        <h1>Analytics</h1>
        <p>Views count each visit to your page. Clicks count taps on an event.</p>
      </div>

      <div className="filter-row">
        <div className="segmented" role="radiogroup" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={days === r} className={days === r ? "is-selected" : ""} onClick={() => setDays(r)}>
              {r} days
            </button>
          ))}
        </div>
        <button type="button" className="text-btn" onClick={() => setAsTable(!asTable)}>
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {stats.error && <p className="form-error">{stats.error.message}</p>}
      {!s && !stats.error && <p className="muted">Loading your numbers…</p>}

      {s && (
        <>
          <div className="stat-row">
            <Stat label="Views" value={compact.format(s.views)} />
            <Stat label="Clicks" value={compact.format(s.clicks)} />
            <Stat label="Click rate" value={`${Math.round(s.clickRate * 100)}%`} />
          </div>

          <section className="panel">
            <h2 className="panel-title">Views and clicks per day</h2>
            {asTable ? <DayTable series={s.series} /> : <LineChart series={s.series} />}
          </section>

          <section className="panel">
            <h2 className="panel-title">Most clicked events</h2>
            <TopEvents summary={s} />
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

/** A "nice" upper bound for the y-axis: 1, 2, 5 × 10ⁿ. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= v) return m * mag;
  return 10 * mag;
}

function LineChart({ series }: { series: AnalyticsDayDTO[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real pixel width so text stays 12px instead of scaling with the SVG.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const H = W < 480 ? 200 : 240;
  const pad = { top: 16, right: 56, bottom: 28, left: 40 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...series.map((d) => Math.max(d.views, d.clicks))));
  const x = (i: number) => pad.left + (series.length <= 1 ? iw / 2 : (i / (series.length - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / max) * ih;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const every = Math.ceil(series.length / Math.max(3, Math.floor(W / 90)));
  const last = series.length - 1;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * iw;
    setHover(Math.max(0, Math.min(last, Math.round((px / iw) * last))));
  }

  const h = hover !== null ? series[hover] : null;
  const endLabels = SERIES.map((s) => ({ ...s, y: y(series[last]?.[s.key] ?? 0) }));
  // Keep end labels from overlapping when the two lines finish close together.
  if (endLabels.length === 2 && Math.abs(endLabels[0]!.y - endLabels[1]!.y) < 14) {
    const mid = (endLabels[0]!.y + endLabels[1]!.y) / 2;
    const up = endLabels[0]!.y <= endLabels[1]!.y ? 0 : 1;
    endLabels[up]!.y = mid - 7;
    endLabels[1 - up]!.y = mid + 7;
  }

  return (
    <div className="chart">
      <ul className="legend" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key}>
            <span className="legend-key" style={{ background: s.color }} /> {s.label}
          </li>
        ))}
      </ul>
      <div className="chart-box" ref={box}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Views and clicks over the last ${series.length} days`}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} />
              <text className="tick" x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {compact.format(t)}
              </text>
            </g>
          ))}
          {series.map((d, i) =>
            (last - i) % every === 0 && (i === last || i === 0 || last - i >= every) ? (
              <text key={d.date} className="tick" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}>
                {dayLabel(d.date)}
              </text>
            ) : null,
          )}

          {SERIES.map((s) => (
            <g key={s.key}>
              <path
                d={`M${series.map((d, i) => `${x(i)},${y(d[s.key])}`).join("L")}L${x(last)},${y(0)}L${x(0)},${y(0)}Z`}
                fill={s.color}
                opacity={0.1}
              />
              <polyline className="line" points={series.map((d, i) => `${x(i)},${y(d[s.key])}`).join(" ")} stroke={s.color} />
              {last >= 0 && <circle className="dot" cx={x(last)} cy={y(series[last]![s.key])} r={4} fill={s.color} />}
            </g>
          ))}
          {endLabels.map((s) => (
            <text key={s.key} className="end-label" x={x(last) + 8} y={s.y} dy="0.32em">
              {full.format(series[last]?.[s.key] ?? 0)}
            </text>
          ))}

          {h && hover !== null && (
            <g pointerEvents="none">
              <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} />
              {SERIES.map((s) => (
                <circle key={s.key} className="dot" cx={x(hover)} cy={y(h[s.key])} r={4} fill={s.color} />
              ))}
            </g>
          )}
          <rect
            x={pad.left}
            y={pad.top}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {h && hover !== null && (
          <div className="tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }} role="status">
            <b>{dayLabel(h.date)}</b>
            {SERIES.map((s) => (
              <span key={s.key}>
                <span className="legend-key" style={{ background: s.color }} /> {s.label} <b>{full.format(h[s.key])}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayTable({ series }: { series: AnalyticsDayDTO[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Views</th>
            <th scope="col">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {[...series].reverse().map((d) => (
            <tr key={d.date}>
              <th scope="row">{dayLabel(d.date)}</th>
              <td>{full.format(d.views)}</td>
              <td>{full.format(d.clicks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopEvents({ summary }: { summary: AnalyticsSummaryDTO }) {
  const top = summary.topEvents;
  if (top.length === 0) return <p className="muted">No clicks in this period yet. Share your page link to get some.</p>;
  const max = Math.max(...top.map((t) => t.clicks));
  return (
    <ul className="bar-list">
      {top.map((t) => (
        <li key={t.eventId} title={`${t.title}: ${full.format(t.clicks)} clicks`}>
          <span className="bar-name">{t.title}</span>
          <span className="bar-track">
            <span className="bar" style={{ width: `${(t.clicks / max) * 100}%` }} />
          </span>
          <span className="bar-value">{full.format(t.clicks)}</span>
        </li>
      ))}
    </ul>
  );
}
