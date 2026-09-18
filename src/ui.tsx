import { CSSProperties, ReactNode, useRef } from "react";
import { Clapperboard, Ghost, Mail, Pin } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./hooks";
import { cn } from "./utils/cn";

/* ---------- Scroll reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "left" | "right" | "scale";
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const v = variant === "left" ? "rv-left" : variant === "right" ? "rv-right" : variant === "scale" ? "rv-scale" : "";
  return (
    <div
      ref={ref}
      className={cn("rv", v, inView && "rv-on", className)}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function LineReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  return (
    <span ref={ref} className={cn("line-mask", inView && "rv-on", className)}>
      <span style={{ transitionDelay: `${delay}ms` }}>{children}</span>
    </span>
  );
}

/* ---------- Magnetic ---------- */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("inline-block transition-transform duration-300 ease-out will-change-transform", className)}>
      {children}
    </div>
  );
}

/* ---------- Buttons (skewed, v3rsi0n style) ---------- */
export function ButtonPrimary({ children, href = "#work", className, external }: { children: ReactNode; href?: string; className?: string; external?: boolean }) {
  return (
    <Magnetic>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={cn(
          "group inline-flex items-center gap-2.5 bg-lime px-7 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-ink-900",
          "skew-x-[-6deg] transition-all duration-300 hover:bg-lime-deep hover:shadow-[0_0_40px_-8px_rgba(200,240,79,0.55)] [&>*]:skew-x-[6deg]",
          className
        )}
      >
        <span className="inline-flex items-center gap-2.5">
          {children}
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden>
            <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </Magnetic>
  );
}

export function ButtonGhost({ children, href, className, external }: { children: ReactNode; href: string; className?: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "group inline-flex items-center gap-2.5 skew-x-[-6deg] border border-line px-7 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-snow",
        "transition-all duration-300 hover:border-lime/60 hover:text-lime [&>*]:skew-x-[6deg]",
        className
      )}
    >
      <span className="inline-flex items-center gap-2.5">
        {children}
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden>
          <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

/* ---------- Section header (index / kicker / display title) ---------- */
export function SectionHead({
  index,
  kicker,
  title,
  note,
  align = "left",
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  note?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-14 md:mb-20", align === "center" && "text-center")}>
      <Reveal>
        <div className={cn("flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.32em] text-lime", align === "center" && "justify-center")}>
          <span className="text-fog-dim">{index}</span>
          <span className="h-px w-10 bg-lime/40" aria-hidden />
          <span>{kicker}</span>
        </div>
      </Reveal>
      <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight text-snow sm:text-5xl lg:text-6xl">
        <LineReveal delay={80}>{title}</LineReveal>
      </h2>
      {note && (
        <Reveal delay={160}>
          <p className={cn("mt-6 max-w-xl text-base leading-relaxed text-fog md:text-lg", align === "center" && "mx-auto")}>{note}</p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------- Marquee ---------- */
export function Marquee({ children, duration = 36, className }: { children: ReactNode; duration?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="marquee-track flex w-max items-center" style={{ "--marquee-dur": `${duration}s` } as CSSProperties}>
        <div className="flex items-center">{children}</div>
        <div className="flex items-center" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/* ---------- Social icons (lucide + source brand paths) ---------- */
const BRAND_PATHS: Record<string, string> = {
  telegram:
    "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.91.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  discord:
    "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.178 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
  lastfm:
    "M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.648-3.244-4.288 0-3.378 1.704-4.59 3.382-4.59 2.42 0 3.188 1.57 3.848 3.574l.879 2.75c.879 2.64 2.53 4.752 7.293 4.752 3.409 0 5.722-1.043 5.722-3.793 0-2.22-1.265-3.37-3.63-3.924l-1.76-.384c-1.21-.274-1.565-.769-1.565-1.593 0-.935.741-1.483 1.95-1.483 1.32 0 2.034.494 2.144 1.676l2.75-.33C24.736 6.64 23.035 5.5 20.285 5.5c-3.024 0-4.838 1.374-4.838 3.737 0 1.956 1.1 3.2 3.847 3.848l1.87.439c1.374.303 1.814.88 1.814 1.758 0 1.07-.99 1.51-2.915 1.51-2.75 0-3.93-1.428-4.588-3.38l-.88-2.749c-1.154-3.578-3.023-4.883-6.707-4.883C3.133 5.78 0 7.843 0 12.04c0 4.07 2.42 6.18 5.995 6.18 3.08 0 4.59-1.012 4.59-1.012z",
  anilist:
    "M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.077 3.133H17.5L11.134 2.943zM7.543 14.075l1.801-5.515 1.8 5.515zM22.689 17.502v-14.56h-4.399v16.02c0 1.117.807 2.038 1.909 2.038h4.712v-3.498z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.688.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  youtube:
    "M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};

export function SocialIcon({ kind, className }: { kind: string; className?: string }) {
  if (BRAND_PATHS[kind]) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={BRAND_PATHS[kind]} />
      </svg>
    );
  }
  const map: Record<string, ReactNode> = {
    snapchat: <Ghost className={className} />,
    pinterest: <Pin className={className} />,
    trakt: <Clapperboard className={className} />,
    mail: <Mail className={className} />,
  };
  return <>{map[kind] ?? <Mail className={className} />}</>;
}
