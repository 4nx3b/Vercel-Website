import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { HERO_STATS, TERMINAL_LINES, TICKER_TOOLS } from "../lib/data";
import { useInView, useIstClock } from "../hooks/useInView";
import { Sparkline } from "./Sparkline";
import { MonoTag, StatusDot } from "./ui";

/** Device control panel: identity metrics, a looping boot log, the toolchain manifest. */
export function BootFrame() {
  const clock = useIstClock();
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [booted, setBooted] = useState(0);

  // Boot sequence — line by line, hold, wipe, repeat.
  useEffect(() => {
    if (booted >= TERMINAL_LINES.length) {
      const t = setTimeout(() => setBooted(0), 3600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBooted((n) => n + 1), booted === 0 ? 400 : 620);
    return () => clearTimeout(t);
  }, [booted]);

  return (
    <div
      ref={ref}
      className="animate-frame-in overflow-hidden rounded-lg border border-carbon-lift bg-panel"
      role="img"
      aria-label="Boot sequence panel for therealreze — skills, repos, anime stats and the toolchain"
    >
      {/* Window chrome */}
      <div className="flex h-10 items-center justify-between border-b border-carbon-lift bg-carbon-lift/40 px-4">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-graphite-mid" />
          <span className="h-2.5 w-2.5 rounded-full bg-ash-stroke" />
          <span className="h-2.5 w-2.5 rounded-full bg-carbon-lift" />
        </div>
        <MonoTag className="text-pale-stone">reze — /system/bin</MonoTag>
        <div className="flex items-center gap-2">
          <StatusDot tone="orange" pulse />
          <MonoTag className="text-bone">Live</MonoTag>
          <MonoTag className="hidden text-graphite-mid tabular sm:inline">{clock}</MonoTag>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        {/* Identity metrics */}
        <div className="grid grid-cols-2 gap-px border-b border-carbon-lift bg-carbon-lift lg:border-b-0 lg:border-r">
          {HERO_STATS.map((t) => (
            <div key={t.label} className="bg-panel p-5">
              <MonoTag className="text-pale-stone">{t.label}</MonoTag>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-geist text-heading text-bone tabular">{t.value}</span>
                <span
                  className={cn(
                    "font-geist-mono text-caption uppercase tracking-[-0.02em]",
                    t.tone === "green" ? "text-metric-green" : "text-signal-orange"
                  )}
                >
                  {t.delta}
                </span>
              </div>
              <Sparkline data={t.spark} tone={t.tone} className="mt-3" />
            </div>
          ))}
        </div>

        {/* Boot log */}
        <div className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <MonoTag className="text-pale-stone">Boot Log</MonoTag>
            <StatusDot tone="orange" pulse />
          </div>
          <ul className="mt-4 flex min-h-[228px] flex-col justify-start gap-2.5 overflow-hidden">
            {TERMINAL_LINES.slice(0, booted).map((l, i) => (
              <li key={i} className="animate-log-in font-geist-mono text-caption leading-[1.4] tracking-[-0.02em]">
                <span className="text-graphite-mid tabular">[{String(i).padStart(2, "0")}]</span>{" "}
                <span className={l.tone === "prompt" ? "text-bone" : l.tone === "ok" ? "text-metric-green" : "text-signal-orange"}>
                  {l.text}
                </span>
                {i === booted - 1 && booted < TERMINAL_LINES.length && (
                  <span className="animate-caret text-signal-orange">▮</span>
                )}
              </li>
            ))}
            {booted >= TERMINAL_LINES.length && (
              <li className="animate-log-in font-geist-mono text-caption tracking-[-0.02em] text-graphite-mid">
                — sequence complete, signal stable
              </li>
            )}
          </ul>
          <div className="mt-4 border-t border-carbon-lift pt-3">
            <MonoTag className="text-graphite-mid">
              init.reze.rc<span className="animate-caret text-signal-orange">▮</span>
            </MonoTag>
          </div>
        </div>
      </div>

      {/* Toolchain manifest */}
      <div className="border-t border-carbon-lift p-5">
        <div className="flex items-center justify-between">
          <MonoTag className="text-pale-stone">Toolchain — 12 units loaded</MonoTag>
          <MonoTag className="text-graphite-mid">MAGISK + KERNELSU</MonoTag>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TICKER_TOOLS.map((tool, i) => (
            <span
              key={tool}
              className="border border-carbon-lift px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone"
              style={inView ? { animation: `fade-up 0.22s cubic-bezier(0.4,0,0.2,1) ${i * 45}ms both` } : { opacity: 0 }}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
