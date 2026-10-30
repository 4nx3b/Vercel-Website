import { useEffect, useRef, useState, type RefObject } from "react";
import { prefersReducedMotion } from "./useInView";

/**
 * A build ticker on one rAF clock. It advances the running stage every `period`
 * ms, but only while the element is on screen, the tab is visible and it is not
 * paused. setState fires only when the stage changes; the elapsed mm:ss is
 * written straight into `clockRef` (at most once per second).
 */
export function useTicker(
  ref: RefObject<Element | null>,
  clockRef: RefObject<HTMLElement | null>,
  { period, stages, start }: { period: number; stages: number; start: number }
) {
  const [stage, setStage] = useState(start);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(() => prefersReducedMotion());
  const stageRef = useRef(start);
  const elapsed = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || paused) return;

    let raf = 0;
    let last = 0;
    let visible = false;
    let shownSec = -1;
    let shownEl: HTMLElement | null = null;

    const write = () => {
      const s = Math.floor(elapsed.current / 1000);
      const el = clockRef.current;
      // rewrite when the second ticks over or React mounted the next stage's span
      if (el && (s !== shownSec || el !== shownEl)) {
        shownSec = s;
        shownEl = el;
        el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      }
    };
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 0; // clamp after jank / tab return
      last = now;
      elapsed.current += dt;
      if (elapsed.current >= period) {
        elapsed.current = 0;
        stageRef.current = (stageRef.current + 1) % stages;
        setStage(stageRef.current);
      }
      write();
      raf = requestAnimationFrame(frame);
    };
    const startLoop = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) startLoop();
      else stopLoop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stopLoop() : startLoop());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopLoop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref, clockRef, period, stages, reduced, paused]);

  return { stage, paused, setPaused, reduced };
}
