import { useEffect, useRef } from "react";

/**
 * Shared behaviour for modal dialogs: Escape closes it, focus moves into it
 * when it opens and goes back to whatever opened it when it closes, and the
 * page behind stops scrolling.
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const initialFocus = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocus.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  return initialFocus;
}
