import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { MUSIC, QUOTES, RADIO_TRACKS } from "../lib/data";
import { ArrowRight, ArrowUpRight } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
};

/** Real audio engine — play/pause, seek, volume, track switching. */
function Radio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(72);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    audioRef.current = a;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setIdx((i) => (i + 1) % RADIO_TRACKS.length);
    const onErr = () => { setErr(true); setPlaying(false); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
      a.src = "";
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = vol / 100;
  }, [vol]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setErr(false);
    setProgress(0);
    a.src = RADIO_TRACKS[idx].src;
    if (playing) a.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        if (!a.src || a.src !== RADIO_TRACKS[idx].src) a.src = RADIO_TRACKS[idx].src;
        await a.play();
        setErr(false);
        setPlaying(true);
      } catch {
        setErr(true);
        setPlaying(false);
      }
    }
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = v;
    setProgress(v);
  };

  const track = RADIO_TRACKS[idx];

  return (
    <div className="lift flex h-full flex-col rounded-lg border border-carbon-lift bg-carbon-lift/15 p-6 backdrop-blur-sm hover:border-ash-stroke sm:p-7">
      <div className="flex items-center justify-between">
        <MonoTag className="text-pale-stone">signal radio</MonoTag>
        <span className="flex items-center gap-2">
          <StatusDot tone={playing ? "green" : "orange"} pulse={playing} />
          <MonoTag className={playing ? "text-metric-green" : "text-signal-orange"}>{playing ? "On air" : "Standby"}</MonoTag>
        </span>
      </div>

      <div className="mt-6 flex items-center gap-4">
        {/* Play / pause */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            playing
              ? "border-metric-green/60 bg-metric-green/15 text-metric-green"
              : "border-ash-stroke bg-carbon-lift text-bone hover:border-pale-stone hover:text-chalk active:scale-95"
          )}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-[1px]"><path d="M7 4.5v15L19.5 12 7 4.5Z" /></svg>
          )}
        </button>

        {/* Eq + now playing */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-5 items-end gap-[3px]", !playing && "opacity-40")} aria-hidden>
              {[70, 100, 55, 85, 40].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] origin-bottom animate-eq bg-metric-green"
                  style={{ height: `${h}%`, animationDelay: `${i * 130}ms`, animationPlayState: playing ? "running" : "paused" }}
                />
              ))}
            </span>
            <div className="min-w-0">
              <p className="truncate font-geist text-[18px] leading-tight tracking-[-0.02em] text-bone">{track.title}</p>
              <MonoTag className="block truncate text-warm-granite">{track.artist} · stream {track.id}</MonoTag>
            </div>
          </div>
        </div>
      </div>

      {/* Seek */}
      <div className="mt-5">
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          value={Math.floor(progress)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-carbon-lift accent-[#a0ca92]"
        />
        <div className="mt-1.5 flex justify-between font-geist-mono text-[10px] uppercase tracking-[0.04em] text-graphite-mid tabular">
          <span>{fmt(progress)}</span>
          <span>{err ? "stream offline" : fmt(duration)}</span>
        </div>
      </div>

      {/* Track switcher + volume */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-carbon-lift pt-4">
        <div className="flex gap-1.5">
          {RADIO_TRACKS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIdx(i)}
              aria-label={`Stream ${t.id}`}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150",
                i === idx ? "border-signal-orange/60 text-signal-orange" : "border-carbon-lift text-graphite-mid hover:border-ash-stroke hover:text-bone"
              )}
            >
              {t.id}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="h-3.5 w-3.5 text-graphite-mid"><path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4ZM16 9a4.5 4.5 0 0 1 0 6" /></svg>
          <input
            type="range"
            min={0}
            max={100}
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-carbon-lift accent-[#ee6018]"
          />
          <span className="w-8 text-right font-geist-mono text-[10px] text-warm-granite tabular">{vol}%</span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MUSIC.genres.map((g) => (
          <span key={g} className="border border-carbon-lift px-2 py-1 font-geist-mono text-[10px] lowercase tracking-[-0.02em] text-graphite-mid">{g}</span>
        ))}
      </div>

      <a href={MUSIC.url} target="_blank" rel="noreferrer" className="group mt-5 flex items-center gap-2 border-t border-carbon-lift pt-4">
        <MonoTag className="text-pale-stone transition-colors duration-150 group-hover:text-chalk">zensxin on last.fm</MonoTag>
        <ArrowUpRight className="h-3 w-3 text-pale-stone transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk" />
      </a>
    </div>
  );
}

export function Now() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[i];

  return (
    <section id="now" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="04" title="Now" note="Currently orbiting" />

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
        {/* Rotating quote — the bright object in the room */}
        <Reveal>
          <button
            type="button"
            onClick={() => setI((n) => (n + 1) % QUOTES.length)}
            className="grain group block h-full w-full rounded-lg bg-bone p-8 text-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 sm:p-10"
            aria-label="Next quote"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <StatusDot tone="orange" />
                <MonoTag className="text-obsidian-canvas">Now playing — thought</MonoTag>
              </span>
              <MonoTag className="text-graphite-mid tabular">{String(i + 1).padStart(2, "0")} / {String(QUOTES.length).padStart(2, "0")}</MonoTag>
            </div>

            <blockquote key={i} className="animate-log-in mt-10 min-h-[110px] font-geist text-heading tracking-[-0.031em] text-obsidian-canvas">
              “{q.text}”
            </blockquote>
            <MonoTag className="mt-5 block text-graphite-mid">— {q.author}</MonoTag>

            <span className="mt-9 flex items-center gap-2 border-t border-obsidian-canvas/15 pt-5">
              <MonoTag className="text-obsidian-canvas transition-colors duration-150 group-hover:text-carbon-lift">Next transmission</MonoTag>
              <ArrowRight className="h-3 w-3 text-obsidian-canvas transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </button>
        </Reveal>

        <Reveal delay={100}>
          <Radio />
        </Reveal>
      </div>
    </section>
  );
}
