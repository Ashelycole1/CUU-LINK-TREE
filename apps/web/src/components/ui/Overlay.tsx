import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDialog } from "../../lib/useDialog";
import { Button, IconButton } from "./Button";
import { Icon, type IconName } from "./Icon";

export interface MenuItem {
  label: string;
  icon?: IconName;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * The ⋯ dropdown. Opens below its trigger, closes on Escape, outside click or
 * selection; arrow keys move between items.
 */
export function Menu({ label, items, icon = "more", trigger: custom }: { label: string; items: MenuItem[]; icon?: IconName; /** Custom face for the trigger, e.g. an avatar. */ trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const first = root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    first?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    list[(i + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length]?.focus();
  }

  return (
    <div className="ui-menu" ref={root}>
      {custom ? (
        <button
          ref={trigger}
          type="button"
          className="ui-menu-face"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          {custom}
        </button>
      ) : (
        <IconButton
          ref={trigger}
          icon={icon}
          label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        />
      )}
      {open && (
        <div className="ui-menu-list" role="menu" id={menuId} aria-label={label} onKeyDown={onMenuKey}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={item.danger ? "is-danger" : undefined}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.icon && <Icon name={item.icon} size={16} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Asks before something irreversible. The safe choice has focus first, so Enter never destroys anything. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const safe = useDialog<HTMLButtonElement>(true, onCancel);
  const titleId = useId();
  const bodyId = useId();
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}>
        <h2 id={titleId}>{title}</h2>
        <div id={bodyId} className="modal-body">
          {body}
        </div>
        <div className="editor-actions">
          <Button ref={safe} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} icon={danger ? "trash" : undefined} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- toasts ---------- */

interface ToastMessage {
  id: number;
  text: string;
  tone: "default" | "success" | "danger";
  action?: { label: string; href: string };
}

const ToastContext = createContext<((text: string, options?: Omit<ToastMessage, "id" | "text">) => void) | null>(null);

/** Small messages at the bottom of the screen that fade after a few seconds. Announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const show = useCallback((text: string, options?: Omit<ToastMessage, "id" | "text">) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text, tone: options?.tone ?? "default", action: options?.action }]);
    window.setTimeout(() => setToasts((t) => t.filter((m) => m.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="ui-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast is-${t.tone}`}>
            {t.tone === "success" && <Icon name="check" size={18} />}
            {t.tone === "danger" && <Icon name="alert" size={18} />}
            <span>{t.text}</span>
            {t.action && (
              <a href={t.action.href} target="_blank" rel="noreferrer">
                {t.action.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>.");
  return show;
}
