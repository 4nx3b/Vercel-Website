import { useRef } from "react";
import type { ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "./hooks";
import { cn } from "./utils/cn";

/** Pointer-tracked 3D tilt (fine-pointer devices only). Writes transforms
 *  directly inside a rAF — at most one paint per frame, zero React
 *  re-renders — and does nothing for reduced-motion or touch users. */
export function Tilt({
  children,
  max = 7,
  className,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !fine) return;
    const host = e.currentTarget as HTMLElement;
    const { clientX, clientY } = e;
    if (raf.current) return; // one queued frame max
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const r = host.getBoundingClientRect();
      const el = ref.current;
      if (!el || r.width === 0 || r.height === 0) return;
      const px = (clientX - r.left) / r.width - 0.5;
      const py = (clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
  };

  const onLeave = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("tilt-card", className)}>
      {children}
    </div>
  );
}
