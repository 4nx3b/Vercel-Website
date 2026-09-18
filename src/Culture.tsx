import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Music2, Pause, Play, Volume2 } from "lucide-react";
import { ANIME, INTERESTS, MUSIC } from "./data";
import { useClock } from "./hooks";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function MusicSection() {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(18);
  const [vol, setVol] = useState(MUSIC.now.vol);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.25)), 120);
    return () => clearInterval(iv);
  }, [playing]);

  return (
    <section id="music" className="relative border-t border-line py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 top-24 h-[420px] w-[420px] rounded-full bg-skyy/[0.05] blur-[110px]" aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="06"
          kicker="music + anime · input streams"
          title={
            <>
              Quiet sound, loud systems, <span className="text-lime">deep lists.</span>
            </>
          }
          note="What runs in the background while the build compiles — scrobbled on Last.fm, tracked on AniList, both as zensxin."
        />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal variant="left">
            <div className="flex h-full flex-col justify-between border border-line bg-ink-850 p-7 transition-colors duration-500 hover:border-lime/35">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center border border-line bg-ink-800 text-lime">
                  <Music2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-snow">{MUSIC.handle}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim">last.fm · music scrobbler</p>
                </div>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {MUSIC.genres.map((g) => (
                  <li key={g} className="border border-line px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog transition-colors hover:border-lime/50 hover:text-lime">
                    {g}
                  </li>
                ))}
              </ul>
              <div className="mt-7 grid grid-cols-2 divide-x divide-line border border-line">
                <div className="px-4 py-3.5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog-dim">anime · anilist</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-snow">
                    {ANIME.count} <span className="text-mint">titles</span>
                  </p>
                </div>
                <div className="px-4 py-3.5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog-dim">mean score</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-snow">
                    {ANIME.mean} <span className="text-mint">/100</span>
                  </p>
                </div>
              </div>
              <a
                href={MUSIC.url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 self-start border border-line px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-snow transition-all hover:border-lime/60 hover:text-lime"
              >
                <ExternalLink className="h-3.5 w-3.5" /> scrobble history
              </a>
            </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <div className="border border-line bg-ink-850 p-7">
              <div className="flex items-center justify-between">
                <span className="bg-lime/10 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-lime">now on site</span>
                <span className={cn("flex h-6 items-end gap-[3px]", !playing && "eq-paused")} aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="eq-bar w-[3px] rounded-full bg-lime" style={{ height: "100%", animationDelay: `${i * 0.14}s` }} />
                  ))}
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-snow">{MUSIC.now.track}</p>
              <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.16em] text-fog">{MUSIC.now.artist}</p>

              <div className="mt-6">
                <div className="h-1.5 w-full overflow-hidden bg-ink-700">
                  <div className="h-full bg-lime transition-[width] duration-150" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-fog-dim">
                  <span>{fmt(progress * 2.4)}</span>
                  <span>{fmt(240)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setPlaying(!playing)}
                  aria-label={playing ? "Pause" : "Play"}
                  className="flex h-11 w-11 shrink-0 items-center justify-center bg-lime text-ink-900 transition-all duration-300 hover:bg-lime-deep hover:shadow-[0_0_28px_-6px_rgba(200,240,79,0.6)]"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
                </button>
                <label className="flex flex-1 items-center gap-3">
                  <Volume2 className="h-4 w-4 shrink-0 text-fog-dim" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vol}
                    onChange={(e) => setVol(Number(e.target.value))}
                    aria-label="Volume"
                    className="h-1.5 w-full cursor-pointer appearance-none bg-ink-700 accent-[#c8f04f]"
                  />
                  <span className="w-9 text-right font-mono text-[11px] tabular-nums text-fog">{vol}%</span>
                </label>
              </div>
            </div>

            {/* time link + interests row */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TimeCard />
              <a
                href={ANIME.url}
                target="_blank"
                rel="noreferrer"
                className="hover-sweep group flex flex-col justify-between border border-line bg-ink-850 p-6 transition-all duration-400 hover:border-lime/40"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog-dim">full anime list</span>
                <span className="py-4 font-display text-xl font-bold uppercase tracking-tight text-snow transition-colors group-hover:text-lime">
                  anilist.co/user/zensxin
                </span>
                <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lime">
                  {ANIME.episodes.toLocaleString("en-US")} episodes <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* interests */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {INTERESTS.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <div className="group h-full border border-line bg-ink-850 p-6 transition-all duration-400 hover:-translate-y-1 hover:border-lime/40">
                <span className="text-2xl" aria-hidden>{it.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight text-snow transition-colors group-hover:text-lime">{it.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fog">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimeCard() {
  const ist = useClock("Asia/Kolkata");
  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const local = useClock(localTz);
  const synced = ist === local;
  return (
    <div className="flex flex-col justify-between border border-line bg-ink-850 p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog-dim">time link · 12h</span>
        <span className={cn("px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em]", synced ? "bg-mint/15 text-mint" : "bg-lime/10 text-lime")}>
          {synced ? "synced" : "linked"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog-dim">ist · gmt+5:30</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums text-snow">{ist}</p>
        </div>
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog-dim">your time</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums text-lime">{local}</p>
        </div>
      </div>
      <p className="font-mono text-[10.5px] text-fog-dim">{synced ? "Same timezone — we are synced." : "Time zones apart, same signal."}</p>
    </div>
  );
}

export default MusicSection;
