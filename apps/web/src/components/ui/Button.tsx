import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "compact";
  icon?: IconName;
  loading?: boolean;
  block?: boolean;
};

/** Pill button. Primary = yellow with dark text; secondary = outlined. Disabled is opacity 0.4 on the same colours. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "default", icon, loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const classes = ["btn", `btn-${variant}`, size === "compact" && "btn-small", block && "btn-block", className].filter(Boolean).join(" ");
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  /** Required: the accessible name, since the button shows only an icon. */
  label: string;
  tone?: "default" | "danger";
  size?: number;
};

/** 40×40 round icon button (44 on touch screens). Muted until hovered. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, tone = "default", size = 20, className, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={["icon-btn", tone === "danger" && "danger", className].filter(Boolean).join(" ")} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
});

/** The round yellow "open" button (the play-button pattern): 48px, dark icon. */
export function CircleAction({
  label,
  icon = "play",
  onClick,
  href,
  size = 48,
  className,
}: {
  label: string;
  icon?: IconName;
  onClick?: () => void;
  href?: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  const classes = ["circle-action", className].filter(Boolean).join(" ");
  const glyph: ReactNode = <Icon name={icon} size={Math.round(size * 0.42)} className={icon === "play" ? "circle-action-play" : undefined} />;
  if (href) {
    return (
      <a href={href} className={classes} style={style} aria-label={label} title={label} onClick={onClick}>
        {glyph}
      </a>
    );
  }
  return (
    <button type="button" className={classes} style={style} aria-label={label} title={label} onClick={onClick}>
      {glyph}
    </button>
  );
}
