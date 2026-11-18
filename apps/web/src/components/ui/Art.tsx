import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleAction } from "./Button";
import { Icon, categoryIcon, type IconName } from "./Icon";

/** Muted, mid-saturation tiles for artwork without an image. Picked by a hash of the name. */
const TILE_COLOURS = ["#5b4b8a", "#3f6b8c", "#2f7a6b", "#7a5c3e", "#8a4b5e", "#4b5e8a", "#6b6b3f", "#3f5c4b", "#7a4b3e", "#4b4b6b"];

export function hashColour(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TILE_COLOURS[h % TILE_COLOURS.length]!;
}

/**
 * Album-art style artwork: the image when there is one, otherwise a solid tile
 * coloured from the name with an icon (default: from the category) at 40% size.
 */
export function CoverArt({
  src,
  name,
  category,
  icon,
  size,
  radius = "var(--radius-sm)",
  round = false,
  className,
}: {
  src?: string | null;
  name: string;
  category?: string | null;
  icon?: IconName;
  /** Pixel size; omit to fill the parent (e.g. a square grid cell). */
  size?: number;
  radius?: string;
  round?: boolean;
  className?: string;
}) {
  const style = {
    width: size ?? "100%",
    height: size ?? undefined,
    borderRadius: round ? "50%" : radius,
    background: src ? "var(--surface)" : hashColour(name),
  };
  return (
    <span className={["cover-art", className].filter(Boolean).join(" ")} style={style} aria-hidden="true">
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <Icon name={icon ?? categoryIcon(category)} size={size ? Math.round(size * 0.4) : 40} />
      )}
    </span>
  );
}

/**
 * Album-tile card: art, 2-line title, 1-line caption. On hover the background
 * lifts to --surface and a yellow CircleAction slides up over the art.
 */
export function Card({
  to,
  title,
  caption,
  art,
  actionLabel,
}: {
  to: string;
  title: string;
  caption?: ReactNode;
  art: ReactNode;
  actionLabel?: string;
}) {
  return (
    <div className="ui-card">
      <div className="ui-card-art">
        {art}
        <CircleAction className="ui-card-action" label={actionLabel ?? `Open ${title}`} icon="play" href={to} />
      </div>
      <Link to={to} className="ui-card-title">
        {title}
      </Link>
      {caption && <span className="ui-card-caption">{caption}</span>}
    </div>
  );
}

/** Track-list row: art, title + meta, optional columns, actions shown on hover or focus. 56px tall. */
export function ListRow({
  art,
  title,
  meta,
  columns,
  actions,
  index,
  dimmed,
  onClick,
}: {
  art?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  columns?: ReactNode[];
  actions?: ReactNode;
  index?: number;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={`ui-row${dimmed ? " is-dimmed" : ""}${onClick ? " is-clickable" : ""}`} onClick={onClick}>
      {index !== undefined && <span className="ui-row-index">{index}</span>}
      {art && <span className="ui-row-art">{art}</span>}
      <span className="ui-row-main">
        <span className="ui-row-title">{title}</span>
        {meta && <span className="ui-row-meta">{meta}</span>}
      </span>
      {columns?.map((c, i) => (
        <span key={i} className="ui-row-col">
          {c}
        </span>
      ))}
      {actions && (
        <span className="ui-row-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </span>
      )}
    </div>
  );
}

/** Pill filter chip. Selected = yellow with dark text. */
export function Chip({ selected, onClick, children, count }: { selected?: boolean; onClick?: () => void; children: ReactNode; count?: number }) {
  return (
    <button type="button" className={`ui-chip${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>
      {children}
      {count !== undefined && <span className="ui-chip-count">{count}</span>}
    </button>
  );
}

/** Star rating drawn with the lucide Star icon (filled up to the rounded value). */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={["ui-stars", className].filter(Boolean).join(" ")} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} className={n <= full ? "is-on" : "is-off"} />
      ))}
    </span>
  );
}
