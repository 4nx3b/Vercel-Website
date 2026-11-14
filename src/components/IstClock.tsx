import { memo, useEffect, useRef } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Live IST clock that never re-renders its parent: it writes the time straight
 * into its own text node once a second, and only while the tab is visible.
 * (The old hook re-rendered the whole Nav and Footer every second.)
 */
export const IstClock = memo(function IstClock({ prefix = "IST ", className }: { prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id = 0;
    const tick = () => {
      el.textContent = prefix + fmt.format(new Date());
    };
    const start = () => {
      window.clearInterval(id);
      if (document.hidden) return;
      tick();
      id = window.setInterval(tick, 1000);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", start);
    };
  }, [prefix]);
  return (
    <span ref={ref} data-noedit className={className} aria-label="Current time in India (IST)">
      {prefix + fmt.format(new Date())}
    </span>
  );
});
