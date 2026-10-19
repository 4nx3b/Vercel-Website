import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { useInView } from "../hooks/useInView";

/** Scroll reveal — short, mechanical: 200ms cubic-bezier(0.4,0,0.2,1), a 10px rise. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        inView ? "translate-y-0 opacity-100" : "translate-y-[10px] opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
