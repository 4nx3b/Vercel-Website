import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ABOUT_PARAS, ANIME, PHOTOS, REPOS } from "./data";
import { useCountUp, useInView, usePrefersReducedMotion } from "./hooks";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

function Stat({ value, label, start }: { value: number; label: string; start: boolean }) {
  const n = useCountUp(value, start, 1700);
  return (
    <div className="group border-l border-line pl-4 transition-colors duration-500 hover:border-lime">
      <p className="font-display text-3xl font-extrabold tabular-nums tracking-tight text-snow transition-colors duration-300 group-hover:text-lime">
        {Math.round(n).toLocaleString("en-US")}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fog">{label}</p>
    </div>
  );
}

function PhotoStrip() {
  const [idx, setIdx] = useState(0);
  const reduced = usePrefersReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval>>(null);

  const next = useCallback(() => setIdx((i) => (i + 1) % PHOTOS.length), []);
  const prev = useCallback(() => setIdx((i) => (i - 1 + PHOTOS.length) % PHOTOS.length), []);

  useEffect(() => {
    if (reduced) return;
    timer.current = setInterval(next, 7000);
    return () => clearInterval(timer.current!);
  }, [next, reduced]);

  const bump = (fn: () => void) => {
    clearInterval(timer.current!);
    fn();
    if (!reduced) timer.current = setInterval(next, 7000);
  };

  return (
    <div className="group relative border border-line bg-ink-850">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">
        <span>photo_strip — 10 raw</span>
        <span className="text-lime">{String(idx + 1).padStart(2, "0")}/{PHOTOS.length}</span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden">
        {PHOTOS.map((p, i) => (
          <img
            key={p}
            src={p}
            alt={`Portrait capture ${String(i + 1).padStart(2, "0")}`}
            loading={i === 0 ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
              i === idx ? "scale-100 opacity-100" : "scale-105 opacity-0"
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" aria-hidden />

        <button
          type="button"
          onClick={() => bump(prev)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-ink-900/70 text-snow opacity-0 backdrop-blur transition-all duration-300 hover:border-lime/60 hover:text-lime focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => bump(next)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-ink-900/70 text-snow opacity-0 backdrop-blur transition-all duration-300 hover:border-lime/60 hover:text-lime focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line py-3">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => bump(() => setIdx(i))}
            aria-label={`Show photo ${i + 1}`}
            className={cn("h-1.5 rounded-full transition-all duration-400", i === idx ? "w-7 bg-lime" : "w-1.5 bg-ink-600 hover:bg-fog-dim")}
          />
        ))}
      </div>
    </div>
  );
}

export default function About() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <section id="about" className="relative border-t border-line py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="01"
          kicker="about · whoami"
          title={
            <>
              System internals are the
              <br className="hidden md:block" /> only layer that <span className="text-lime">matters.</span>
            </>
          }
        />

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal variant="left">
            <div className="space-y-5 text-[15.5px] leading-relaxed text-fog">
              {ABOUT_PARAS.map((p, i) => (
                <p key={i} className={cn(i === 0 && "text-lg text-snow")}>
                  {i === 0 ? (
                    <>
                      I'm <span className="font-semibold text-lime">therealreze</span> — an Android root specialist. I live at the intersection of low-level system code, kernel internals, and the philosophy that your hardware should answer to you, not its manufacturer.
                    </>
                  ) : (
                    p
                  )}
                </p>
              ))}
            </div>

            <div ref={ref} className="mt-10 grid grid-cols-3 gap-x-5 gap-y-8">
              <Stat value={REPOS.length} label="public repos" start={inView} />
              <Stat value={ANIME.count} label="anime watched" start={inView} />
              <Stat value={ANIME.episodes} label="episodes logged" start={inView} />
            </div>

            <Reveal delay={200} className="mt-10">
              <div className="border border-line bg-ink-850/70 p-6">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog-dim">$ cat philosophy.txt</p>
                <p className="mt-3 font-display text-xl font-bold uppercase tracking-tight text-snow">
                  Hardware should answer to <span className="text-lime">you.</span>
                </p>
              </div>
            </Reveal>
          </Reveal>

          <Reveal variant="right" delay={140}>
            <PhotoStrip />
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog-dim">
              // auto-advances every 7s — or take the wheel
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
