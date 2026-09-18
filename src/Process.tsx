import { PROCESS_STEPS } from "./data";
import { useInView } from "./hooks";
import { Reveal } from "./ui";
import { cn } from "./utils/cn";

const MARKER_STYLE: Record<string, string> = {
  "+": "text-lime border-lime/40 bg-lime/10",
  "~": "text-skyy border-skyy/40 bg-skyy/10",
  "→": "text-mint border-mint/40 bg-mint/10",
};

function SpinBadge() {
  return (
    <div className="relative h-36 w-36" aria-hidden>
      <svg viewBox="0 0 120 120" className="spin-slow h-full w-full">
        <defs>
          <path id="circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-fog font-mono text-[9.2px] uppercase" style={{ letterSpacing: "0.32em" }}>
          <textPath href="#circ">root · flash · mod · repeat ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-lime">rz</span>
      </div>
    </div>
  );
}

function StepCard({ step, i, isLast }: { step: (typeof PROCESS_STEPS)[number]; i: number; isLast: boolean }) {
  const { ref, inView } = useInView<HTMLElement>(0.25);
  return (
    <li
      ref={ref as never}
      className={cn("rv relative pl-10 transition-all duration-700 sm:pl-14", inView && "rv-on")}
      style={{ transitionDelay: `${i * 80}ms` }}
    >
      {!isLast && <span className="absolute bottom-[-2.5rem] left-[7px] top-3 w-px bg-line" aria-hidden />}
      <span className={cn("absolute left-0 top-2 h-[15px] w-[15px] rounded-full border-2 border-lime bg-ink-900 transition-colors duration-500", inView && "bg-lime")} aria-hidden />

      <div className="border border-line bg-ink-850/70 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-lime/35 hover:bg-ink-850 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
          <span className="bg-lime px-2.5 py-1 font-bold text-ink-900">{step.version}</span>
          <span className="text-fog-dim">{step.phase}</span>
          <span className="ml-auto hidden text-fog-dim sm:inline">stage {i + 1}/5</span>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-snow sm:text-3xl">{step.title}</h3>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-fog">{step.desc}</p>

        <ul className="mt-6 space-y-2.5">
          {step.log.map((l) => (
            <li key={l.text} className="flex items-start gap-3 font-mono text-[12px] leading-relaxed text-fog">
              <span className={cn("mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] font-bold", MARKER_STYLE[l.marker])}>
                {l.marker}
              </span>
              <span>
                <span className="text-snow/90">{l.text.split(": ")[0]}:</span> {l.text.split(": ")[1]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function Process() {
  return (
    <section id="process" className="relative border-t border-line py-24 md:py-32">
      {/* glow wrapped in a clip layer — section-level overflow-hidden would
          break the sticky column below; this wrapper only clips the glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute right-0 top-24 h-[420px] w-[420px] rounded-full bg-mint/[0.04] blur-[110px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.32em] text-lime">
                <span className="text-fog-dim">04</span>
                <span className="h-px w-10 bg-lime/40" aria-hidden />
                <span>process · the root cycle</span>
              </div>
            </Reveal>
            <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight text-snow sm:text-5xl lg:text-6xl">
              <Reveal delay={80}>Every great device</Reveal>
              <Reveal delay={160}>
                is a <span className="text-lime">changelog.</span>
              </Reveal>
            </h2>
            <Reveal delay={240}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-fog md:text-lg">
                No mystery meat firmware. My process reads like release notes — named versions, dated builds,
                and a device that can always be recovered. This is the exact cycle every project runs on.
              </p>
            </Reveal>
            <Reveal delay={320} className="mt-10 hidden lg:block">
              <SpinBadge />
            </Reveal>
            <Reveal delay={380}>
              <div className="mt-10 grid max-w-md grid-cols-3 divide-x divide-line border border-line">
                {[
                  ["05", "stages"],
                  ["100%", "recoverable"],
                  ["∞", "iterations"],
                ].map(([v, l]) => (
                  <div key={l} className="px-4 py-5">
                    <p className="font-display text-2xl font-extrabold text-snow">{v}</p>
                    <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog-dim">{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <ol className="relative space-y-10">
            {PROCESS_STEPS.map((s, i) => (
              <StepCard key={s.version} step={s} i={i} isLast={i === PROCESS_STEPS.length - 1} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
