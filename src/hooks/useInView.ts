import { useEffect, useRef, useState } from "react";

/** Observes an element and flips to true once it enters the viewport (once). */
export function useInView<T extends Element = HTMLElement>(threshold = 0.15, rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Also count elements already scrolled past (anchor jumps skip over them)
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}

/** True when the user asked the OS for reduced motion. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Live IST clock (GMT+5:30) — HH:MM:SS, ticking every second. */
export function useIstClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

/** Count-up once `start` flips true. Under reduced motion it lands on the target immediately. */
export function useCountUp(start: boolean, target: number, decimals = 0, duration = 1200) {
  const [val, setVal] = useState(() => (prefersReducedMotion() ? target : 0));
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) {
      setVal(target);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(target * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [start, target, duration]);

  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
