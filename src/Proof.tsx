import type { ComponentType } from "react";
import { Feather, GitBranch, ShieldCheck, Zap } from "lucide-react";
import { PROOF_CARDS, PROOF_STATS, QUOTES } from "./data";
import { useCountUp, useInView } from "./hooks";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  branch: GitBranch,
  bolt: Zap,
  shield: ShieldCheck,
  layers: Feather,
};

function EpisodesCard() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const n = useCountUp(PROOF_STATS.episodes, inView, 1800);
  return (
    <div ref={ref} className="group relative flex h-full flex-col justify-between overflow-hidden border border-line bg-ink-850/80 p-7 transition-colors duration-500 hover:border-lime/40 sm:p-9 md:col-span-3 md:row-span-2">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/[0.07] blur-3xl transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-fog-dim">anilist · zensxin · all time</p>
        <p className="mt-4 font-display text-6xl font-extrabold tracking-tight text-snow sm:text-7xl">
          {Math.round(n).toLocaleString("en-US")}
        </p>
        <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-lime">episodes logged — and counting</p>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-fog">
          {PROOF_STATS.anime} anime, {(PROOF_STATS.minutes / 1440).toFixed(1)} days of runtime. The same patience that
          finishes a 100-episode arc shows up in long-running device trees.
        </p>
      </div>
      <svg viewBox="0 0 320 96" className="mt-8 w-full" aria-hidden>
        <polyline
          points="0,86 32,80 64,82 96,64 128,68 160,50 192,54 224,36 256,40 288,20 320,10"
          fill="none"
          stroke="var(--color-lime)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: inView ? 0 : 1, transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1) 0.3s" }}
        />
        <polyline
          points="0,86 32,80 64,82 96,64 128,68 160,50 192,54 224,36 256,40 288,20 320,10 320,96 0,96"
          fill="url(#sparkfill)"
          opacity={inView ? 0.5 : 0}
          style={{ transition: "opacity 1s ease 1.4s" }}
        />
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-lime)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-lime)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="320" cy="10" r="4" fill="var(--color-lime)" opacity={inView ? 1 : 0} style={{ transition: "opacity 0.4s ease 2s" }} />
      </svg>
    </div>
  );
}

function MeanScoreCard() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const n = useCountUp(PROOF_STATS.mean, inView, 1600, 1);
  const C = 2 * Math.PI * 40;
  return (
    <div ref={ref} className="group flex items-center gap-6 border border-line bg-ink-850/80 p-7 transition-colors duration-500 hover:border-mint/40 sm:p-8 md:col-span-3">
      <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`Mean score ${PROOF_STATS.mean} out of 100`}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-ink-600)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--color-mint)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={inView ? C * (1 - PROOF_STATS.mean / 100) : C}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1) 0.2s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-extrabold text-snow">{n.toFixed(1)}</span>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-mint">mean score / 100</p>
        <p className="mt-2 text-[15px] leading-relaxed text-fog">
          Not everything gets a 90. The ones that do, <span className="text-snow">get rewatched</span> — same as a ROM worth keeping.
        </p>
      </div>
    </div>
  );
}

export default function Proof() {
  return (
    <section id="proof" className="relative border-t border-line bg-ink-950/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="05"
          kicker="proof · signal metrics"
          title={
            <>
              The numbers behind <span className="text-lime">the signal.</span>
            </>
          }
          note="Live-ish stats from GitHub and AniList — the two graphs I actually move every week."
        />

        <div className="grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-3 md:row-span-2" variant="scale">
            <EpisodesCard />
          </Reveal>
          <Reveal className="md:col-span-3" delay={100} variant="scale">
            <MeanScoreCard />
          </Reveal>
          {PROOF_CARDS.map((b, i) => {
            const Icon = ICONS[b.icon];
            return (
              <Reveal key={b.title} className="md:col-span-3" delay={160 + i * 80} variant="scale">
                <div className="group flex h-full gap-5 border border-line bg-ink-850/80 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-lime/40 hover:bg-ink-850 sm:p-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-line text-lime transition-all duration-500 group-hover:border-lime/50 group-hover:bg-lime group-hover:text-ink-900">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-tight text-snow">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fog">{b.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* quotes — scattered postcards */}
        <div className="mt-24 md:mt-32">
          <SectionHead
            index="05.1"
            kicker="side channel · quotes"
            title={
              <>
                Lines I keep <span className="text-lime">pinned.</span>
              </>
            }
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {QUOTES.map((t, i) => (
              <Reveal key={t.text} delay={i * 90}>
                <figure
                  className="group flex h-full flex-col border border-line bg-ink-850/80 p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-2 hover:rotate-0 hover:border-lime/35 hover:bg-ink-850 sm:p-8"
                  style={{ rotate: `${t.rotate}deg` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog-dim">quote_{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-5xl font-extrabold leading-none text-lime/20 transition-colors duration-500 group-hover:text-lime/40" aria-hidden>
                      "
                    </span>
                  </div>
                  <blockquote className={cn("mt-4 flex-1 leading-relaxed text-snow/90", i < 2 ? "font-display text-xl font-semibold tracking-tight sm:text-2xl" : "text-[15px]")}>
                    {t.text}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
                    — {t.author}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
