import { useEffect, useRef, useState, type RefObject } from "react";
import { ANIME } from "../lib/data";

export type AnimeStats = { count: number; episodes: number; minutes: number; mean: number; updatedAt: number | null; live: boolean };

const KEY = "anilist_stats_v1";
const POLL_MS = 60_000;
const BACKOFF_MS = 5 * 60_000;
const QUERY = "query($n:String){User(name:$n){statistics{anime{count episodesWatched minutesWatched meanScore}}}}";

function readCache(): AnimeStats {
  try {
    const v = localStorage.getItem(KEY);
    if (v) {
      const c = JSON.parse(v) as Partial<AnimeStats>;
      if (typeof c.count === "number") return { count: c.count, episodes: c.episodes ?? ANIME.episodes, minutes: c.minutes ?? ANIME.minutes, mean: c.mean ?? ANIME.mean, updatedAt: c.updatedAt ?? null, live: false };
    }
  } catch {
    /* private mode */
  }
  return { count: ANIME.count, episodes: ANIME.episodes, minutes: ANIME.minutes, mean: ANIME.mean, updatedAt: null, live: false };
}

/**
 * Live AniList stats (GraphQL, CORS-open, so it works on Vercel and Cloudflare).
 * Renders the cache first, then fetches on mount and every 60s while the page
 * is visible and the stats are on screen. 429 backs off to 5 minutes.
 */
export function useAniList(ref?: RefObject<Element | null>) {
  const [stats, setStats] = useState<AnimeStats>(readCache);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    let timer = 0;
    let inView = !ref; // without a ref, always eligible
    let delay = 0;
    let ctrl: AbortController | null = null;
    let alive = true;

    const canPoll = () => alive && inView && document.visibilityState === "visible";
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, ms);
    };

    async function tick() {
      if (!canPoll()) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: QUERY, variables: { n: ANIME.handle } }),
          signal: ctrl.signal,
        });
        if (res.status === 429) {
          delay = BACKOFF_MS;
        } else if (res.ok) {
          const j = await res.json();
          const a = j?.data?.User?.statistics?.anime;
          if (a && typeof a.count === "number") {
            const next: AnimeStats = {
              count: a.count,
              episodes: a.episodesWatched,
              minutes: a.minutesWatched,
              mean: a.meanScore,
              updatedAt: Date.now(),
              live: true,
            };
            try {
              localStorage.setItem(KEY, JSON.stringify(next));
            } catch {
              /* private mode */
            }
            if (alive) setStats(next);
          }
          delay = POLL_MS;
        } else {
          delay = POLL_MS;
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        delay = POLL_MS; // offline: keep the cache, try again later
      }
      if (canPoll()) schedule(delay);
    }

    const resume = () => {
      if (canPoll()) schedule(document.visibilityState === "visible" && delay === 0 ? 0 : Math.min(delay, 1500));
      else window.clearTimeout(timer);
    };

    let io: IntersectionObserver | null = null;
    const el = ref?.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        resume();
      });
      io.observe(el);
    } else {
      inView = true;
      schedule(0);
    }
    const onVis = () => {
      // coming back to the tab: refresh straight away
      if (document.visibilityState === "visible") {
        delay = 0;
        resume();
      } else window.clearTimeout(timer);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      ctrl?.abort();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);

  return stats;
}

/** "12s ago" / "4m ago" / "3h ago" */
export function agoShort(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}
