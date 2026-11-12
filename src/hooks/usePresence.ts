import { useEffect, useState } from "react";

export type PresenceState = "open" | "closing";

/**
 * Keeps an element mounted long enough to play its exit animation.
 * `open` → mounted with state "open"; `false` → state "closing" for `exitMs`,
 * then unmounted. Under reduced motion the exit is near-instant.
 */
export function usePresence(open: boolean, exitMs = 180) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<PresenceState>("open");

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState("open");
      return;
    }
    if (!mounted) return;
    setState("closing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setMounted(false), reduced ? 0 : exitMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs]);

  return { mounted, state };
}
