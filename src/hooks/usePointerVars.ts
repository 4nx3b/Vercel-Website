import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "./useInView";

export type PointerFrame = {
  /** -1..1 across the element, 0 at the centre */
  ux: number;
  uy: number;
  /** pixels from the element's top-left corner */
  x: number;
  y: number;
  inside: boolean;
};

/** True only for a precise pointer (mouse / trackpad), never on touch. */
export function hasFinePointer() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: fine)").matches;
}

/**
 * Pointer tracking without React re-renders. One passive pointermove listener;
 * the latest event is applied once per animation frame. By default it writes
 * --px / --py (-1..1) on the element; pass onFrame to drive transforms directly.
 * Inactive on coarse pointers and under reduced motion.
 */
export function usePointerVars<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, onFrame }: { enabled?: boolean; onFrame?: (f: PointerFrame) => void } = {}
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !hasFinePointer() || prefersReducedMotion()) return;

    let raf = 0;
    let last: PointerEvent | null = null;
    let inside = false;

    const apply = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      let f: PointerFrame;
      if (inside && last) {
        const x = last.clientX - rect.left;
        const y = last.clientY - rect.top;
        f = {
          x,
          y,
          ux: Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1)),
          uy: Math.max(-1, Math.min(1, (y / rect.height) * 2 - 1)),
          inside: true,
        };
      } else {
        f = { x: 0, y: 0, ux: 0, uy: 0, inside: false };
      }
      if (onFrame) onFrame(f);
      else {
        el.style.setProperty("--px", f.ux.toFixed(3));
        el.style.setProperty("--py", f.uy.toFixed(3));
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      last = e;
      inside = true;
      schedule();
    };
    const onLeave = () => {
      inside = false;
      schedule();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, enabled, onFrame]);
}
