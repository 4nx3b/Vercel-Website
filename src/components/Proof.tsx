import { ANIME, MUSIC, PROOF_CARDS } from "../lib/data";
import { useCountUp, useInView } from "../hooks/useInView";
import { SkillGlyphs, ArrowUpRight } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

/** Animated equalizer bars for the now-playing panel. */
function EqBars() {
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom animate-eq bg-metric-green"
          style={{ height: `${[70, 100, 55, 85, 40][i]}%`, animationDelay: `${i * 130}ms` }}
        />
      ))}
    </span>
  );
}

function AnimeStat({ value, decimals, label, delay }: { value: number; decimals?: number; label: string; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const display = useCountUp(inView, value, decimals ?? 0, 900 + delay);
  return (
    <div ref={ref} className="p-5">
      <span className="font-geist text-[36px] leading-none tracking-[-0.031em] text-bone tabular">{display}</span>
      <MonoTag className="mt-2 block text-graphite-mid">{label}</MonoTag>
    </div>
  );
}

export function Proof() {
  return (
    <section id="proof" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="05" title="Proof" note="Public record · last.fm + anilist" />

      {/* Operating principles */}
      <div className="mt-12 border-t border-carbon-lift">
        {PROOF_CARDS.map((card, i) => {
          const Glyph = SkillGlyphs[card.glyph];
          return (
            <Reveal key={card.title} delay={i * 50}>
              <div className="group grid items-baseline gap-x-8 gap-y-2 border-b border-carbon-lift py-6 transition-colors duration-150 hover:bg-carbon-lift/20 sm:grid-cols-[40px_240px_1fr] sm:px-4">
                <Glyph className="hidden h-5 w-5 text-pale-stone transition-colors duration-150 group-hover:text-signal-orange sm:block" />
                <h3 className="font-geist text-[20px] tracking-[-0.02em] text-bone">{card.title}</h3>
                <p className="text-body-sm text-warm-granite">{card.desc}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Two instrument panels: last.fm + anilist */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* last.fm */}
        <Reveal delay={60}>
          <div className="flex h-full flex-col rounded-lg border border-carbon-lift p-6 transition-colors duration-150 hover:border-ash-stroke sm:p-8">
            <div className="flex items-center justify-between">
              <MonoTag className="text-pale-stone">last.fm — {MUSIC.handle}</MonoTag>
              <span className="flex items-center gap-2">
                <StatusDot tone="orange" pulse />
                <MonoTag className="text-signal-orange">Scrobbling</MonoTag>
              </span>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <EqBars />
              <div>
                <p className="font-geist text-[24px] leading-none tracking-[-0.025em] text-bone">{MUSIC.now.track}</p>
                <MonoTag className="mt-1.5 block text-warm-granite">{MUSIC.now.artist}</MonoTag>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <MonoTag className="text-graphite-mid">Volume</MonoTag>
                <MonoTag className="text-metric-green tabular">{MUSIC.now.vol}%</MonoTag>
              </div>
              <div className="mt-2 h-1 bg-carbon-lift">
                <div className="h-full bg-metric-green" style={{ width: `${MUSIC.now.vol}%`, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {MUSIC.genres.map((g) => (
                <span key={g} className="border border-carbon-lift px-2.5 py-1.5 font-geist-mono text-caption lowercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone">
                  {g}
                </span>
              ))}
            </div>

            <a href={MUSIC.url} target="_blank" rel="noreferrer" className="group mt-8 flex items-center gap-2 border-t border-carbon-lift pt-5">
              <MonoTag className="text-pale-stone transition-colors duration-150 group-hover:text-chalk">Full scrobble history</MonoTag>
              <ArrowUpRight className="h-3 w-3 text-pale-stone transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk" />
            </a>
          </div>
        </Reveal>

        {/* anilist */}
        <Reveal delay={120}>
          <div className="flex h-full flex-col rounded-lg border border-carbon-lift p-6 transition-colors duration-150 hover:border-ash-stroke sm:p-8">
            <div className="flex items-center justify-between">
              <MonoTag className="text-pale-stone">anilist — {ANIME.handle}</MonoTag>
              <span className="flex items-center gap-2">
                <StatusDot tone="green" />
                <MonoTag className="text-metric-green">Tracking</MonoTag>
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-px border border-carbon-lift bg-carbon-lift">
              <div className="bg-panel"><AnimeStat value={ANIME.count} label="anime watched" delay={0} /></div>
              <div className="bg-panel"><AnimeStat value={ANIME.episodes} label="episodes logged" delay={90} /></div>
              <div className="bg-panel"><AnimeStat value={ANIME.minutes} label="minutes on record" delay={180} /></div>
              <div className="bg-panel"><AnimeStat value={ANIME.mean} decimals={1} label="mean score / 100" delay={270} /></div>
            </div>

            <p className="mt-6 text-body-sm text-warm-granite">
              586 entries and counting — the same patience that goes into reading a 4,000-line kernel patch.
            </p>

            <a href={ANIME.url} target="_blank" rel="noreferrer" className="group mt-auto flex items-center gap-2 border-t border-carbon-lift pt-5">
              <MonoTag className="pt-0 text-pale-stone transition-colors duration-150 group-hover:text-chalk">Full list & ratings</MonoTag>
              <ArrowUpRight className="h-3 w-3 text-pale-stone transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
