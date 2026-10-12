import { useEffect } from "react";

/** Space = play/pause, R = reset. Ignores keystrokes while typing in a form control. */
export function useSimHotkeys(handlers: { toggle?: () => void; reset?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); handlers.toggle?.(); }
      else if (e.key.toLowerCase() === "r") handlers.reset?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers.toggle, handlers.reset]);
}
