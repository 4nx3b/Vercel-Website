import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";
import { ArrowRight } from "./icons";

/* ---------- Buttons ---------- */

type BtnProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function ButtonDark({ className, children, ...rest }: BtnProps) {
  return (
    <a
      {...rest}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-sm bg-carbon-lift px-4 font-geist text-body-sm text-bone",
        "transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-graphite-mid hover:text-chalk",
        className
      )}
    >
      {children}
    </a>
  );
}

export function ButtonGhost({ className, children, arrow = true, ...rest }: BtnProps & { arrow?: boolean }) {
  return (
    <a
      {...rest}
      className={cn(
        "group inline-flex h-10 items-center gap-2 border border-ash-stroke px-4 font-geist text-body-sm text-bone",
        "transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-pale-stone hover:text-chalk",
        className
      )}
    >
      {children}
      {arrow && (
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0.5" />
      )}
    </a>
  );
}

/** Ghost link inverted for bone cards. */
export function ButtonGhostDark({ className, children, ...rest }: BtnProps) {
  return (
    <a
      {...rest}
      className={cn(
        "group inline-flex h-10 items-center gap-2 border border-obsidian-canvas/30 px-4 font-geist text-body-sm text-obsidian-canvas",
        "transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-obsidian-canvas hover:bg-obsidian-canvas hover:text-bone"
      , className)}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0.5" />
    </a>
  );
}

/* ---------- Terminal voice ---------- */

export function StatusDot({ tone = "orange", pulse = false, className }: { tone?: "orange" | "green"; pulse?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        tone === "orange" ? "bg-signal-orange" : "bg-metric-green",
        pulse && tone === "orange" && "animate-pulse-ring",
        className
      )}
    />
  );
}

export function MonoTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-geist-mono text-caption uppercase tracking-[-0.02em]", className)}>
      {children}
    </span>
  );
}

/* ---------- Section header — numbered like an instrument schematic ---------- */

export function SectionHead({
  index,
  title,
  note,
  className,
}: {
  index: string;
  title: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-carbon-lift pt-6", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <MonoTag className="text-pale-stone">
          <span className="text-signal-orange">SEC.{index}</span>
          <span className="mx-2 text-graphite-mid">—</span>
          {title}
        </MonoTag>
        <MonoTag className="hidden text-graphite-mid sm:block">{note}</MonoTag>
      </div>
    </div>
  );
}
