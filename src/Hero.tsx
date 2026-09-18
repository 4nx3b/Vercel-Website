import { useEffect, useMemo, useRef } from "react";
import { HERO_CHIPS, HERO_COPY, HERO_STATS, PHOTOS, TERMINAL_LINES, TICKER_TOOLS } from "./data";
import { useClock, useCountUp, useInView, useScramble, useTypedLines } from "./hooks";
import { ButtonGhost, ButtonPrimary, LineReveal, Marquee, Reveal } from "./ui";
import { Tilt } from "./tilt";

const WORDS = ["DEVICES", "KERNELS", "MODULES", "FIRMWARE"];

function lineColor(line: string) {
  if (line.startsWith("$")) return "text-snow";
  if (line.startsWith("✔")) return "text-mint";
  if (line.startsWith("▲")) return "text-lime";
  return "text-fog";
}

function Terminal() {
  const lines = useMemo(() => TERMINAL_LINES, []);
  const { ref, inView } = useInView<HTMLDivElement>();
  const { done, current } = useTypedLines(lines, 26, 420, 3400, inView);
  return (
    <div ref={ref} className="relative border border-line bg-ink-850/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-skyy/70" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">reze — boot.log</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
          <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" /> live
        </span>
      </div>
      <div className="min-h-[264px] px-5 py-5 font-mono text-[12.5px] leading-[2.05] sm:text-[13px]" role="log" aria-label="Boot log">
        {done.map((l, i) => (
          <p key={i} className={lineColor(l)}>
            {l}
          </p>
        ))}
        <p className={lineColor(current)}>
          {current}
          <span className="caret-blink ml-0.5 inline-block h-[15px] w-[8px] translate-y-[2px] bg-lime" aria-hidden />
        </p>
        {done.length === lines.length && (
          <p className="mt-2 text-fog-dim">
            $ <span className="text-fog">awaiting next module…</span>
          </p>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fog-dim">
        <span>super — rw mounted</span>
        <span>
          <span className="text-lime">▲ 12 modules</span> · selinux enforcing
        </span>
      </div>
    </div>
  );
}

function Stat({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const n = useCountUp(value, inView, 1500 + delay);
  return (
    <div ref={ref} className="group border-l border-line pl-4 transition-colors duration-500 hover:border-lime sm:pl-5">
      <p className="font-display text-3xl font-extrabold tracking-tight text-snow transition-colors duration-300 group-hover:text-lime sm:text-4xl">
        {Math.round(n).toLocaleString("en-US")}
        <span className="text-lime">{suffix}</span>
      </p>
      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog">{label}</p>
    </div>
  );
}

export default function Hero() {
  const { ref: headRef, inView: headIn } = useInView<HTMLDivElement>();
  const word = useScramble(WORDS, 2400, headIn);
  const ist = useClock("Asia/Kolkata");
  const spotRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const spotRaf = useRef(0);

  // cancel any in-flight spotlight frame on unmount
  useEffect(() => () => cancelAnimationFrame(spotRaf.current), []);

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-hidden"
      onMouseMove={(e) => {
        // spotlight via direct style writes, rAF-throttled — at most one
        // paint per frame, and getBoundingClientRect runs inside the
        // frame callback instead of on every mousemove event
        if (spotRaf.current) return;
        const { clientX, clientY } = e;
        spotRaf.current = requestAnimationFrame(() => {
          spotRaf.current = 0;
          const r = heroRef.current?.getBoundingClientRect();
          if (!r || !spotRef.current) return;
          spotRef.current.style.background = `radial-gradient(640px circle at ${((clientX - r.left) / r.width) * 100}% ${((clientY - r.top) / r.height) * 100}%, rgba(200,240,79,0.075), transparent 62%)`;
        });
      }}
    >
      <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" aria-hidden />
      <div
        ref={spotRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ background: "radial-gradient(640px circle at 50% 40%, rgba(200,240,79,0.075), transparent 62%)" }}
        aria-hidden
      />
      <div className="glow-breathe pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-lime/[0.05] blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-30%] left-[-10%] h-[480px] w-[480px] rounded-full bg-skyy/[0.05] blur-[110px]" aria-hidden />
      <div className="aurora pointer-events-none absolute -top-24 left-[-15%] h-[420px] w-[520px] rounded-full blur-[130px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 md:pb-24 md:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          {/* left — statement */}
          <div ref={headRef}>
            <Reveal>
              <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-fog">
                <span className="glass px-3 py-1.5 text-mint">Android root specialist</span>
                <span className="text-fog-dim">custom ROM dev · IST {ist}</span>
              </p>
            </Reveal>

            <h1 className="mt-7 font-display text-[clamp(2.7rem,8.5vw,6.2rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-snow">
              <LineReveal delay={100}>We root</LineReveal>
              <LineReveal delay={220}>
                <span className="whitespace-nowrap text-lime" aria-label={WORDS.join(", ")}>
                  {word}
                </span>
              </LineReveal>
              <LineReveal delay={340}>
                beyond <span className="text-outline">stock.</span>
              </LineReveal>
            </h1>

            <Reveal delay={420}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-fog md:text-lg">
                {HERO_COPY}
              </p>
            </Reveal>

            <Reveal delay={480}>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {HERO_CHIPS.map((c) => (
                  <li key={c} className="border border-line bg-ink-850/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fog transition-colors duration-300 hover:border-lime/50 hover:text-lime">
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={540}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ButtonPrimary href="#work">View the releases</ButtonPrimary>
                <ButtonGhost href="https://github.com/4nx3b" external>
                  GitHub
                </ButtonGhost>
              </div>
            </Reveal>

            <Reveal delay={620}>
              <p className="mt-6 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-fog-dim">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime pulse-dot" aria-hidden />
                open for collabs — telegram: @therealreze
              </p>
            </Reveal>
          </div>

          {/* right — terminal + capture */}
          <Reveal variant="right" delay={300} className="relative">
            <div className="floaty">
              <Tilt max={6}>
                <Terminal />
              </Tilt>
            </div>
            <div className="scanline absolute -bottom-10 -left-3 hidden w-36 overflow-hidden border border-line bg-ink-850/90 shadow-lg backdrop-blur sm:block">
              <img src={PHOTOS[5]} alt="Capture from the reze photo set" className="h-28 w-full object-cover" loading="lazy" />
              <p className="px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fog-dim">capture_06.raw</p>
            </div>
            <div className="shine absolute -right-2 -top-5 hidden rotate-[3deg] border border-lime/40 bg-ink-900/95 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-lime shadow-lg sm:block">
              ▲ root access granted
            </div>
          </Reveal>
        </div>

        {/* stats */}
        <div className="mt-20 grid grid-cols-2 gap-x-6 gap-y-8 md:mt-24 md:grid-cols-4">
          {HERO_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <Stat {...s} delay={i * 120} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* tools marquee */}
      <div className="relative border-y border-line bg-ink-950/60">
        <div className="mx-auto flex max-w-7xl items-center px-5 sm:px-8">
          <span className="hidden shrink-0 border-r border-line py-5 pr-6 font-mono text-[10px] uppercase tracking-[0.26em] text-fog-dim md:block">
            fluent in
          </span>
          <Marquee duration={34} className="flex-1 py-5">
            {TICKER_TOOLS.map((m) => (
              <span key={m} className="flex items-center gap-10 pr-10">
                <span className="whitespace-nowrap font-display text-lg font-bold uppercase tracking-wide text-fog/70 transition-colors duration-300 hover:text-snow">
                  {m}
                </span>
                <span className="h-1 w-1 rotate-45 bg-fog-dim/50" aria-hidden />
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
