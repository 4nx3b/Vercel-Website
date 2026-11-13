import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { PLAYLISTS, type Playlist } from "../lib/data";

/* ---------------- Playlist shelf ---------------- */

/* v2: only titles + counts are cached. Covers are signed URLs that expire, so a
   cached one eventually 404s and leaves a blank card (that was the bug). */
const CACHE_KEY = "yt_playlists_v2";

function readCache(): Playlist[] {
  try {
    localStorage.removeItem("yt_playlists_v1");
    const v = localStorage.getItem(CACHE_KEY);
    if (!v) return PLAYLISTS;
    const cached = JSON.parse(v) as { id: string; title?: string; itemCount?: number | null }[];
    return PLAYLISTS.map((p) => {
      const c = cached.find((x) => x.id === p.id);
      return c ? { ...p, title: c.title || p.title, itemCount: typeof c.itemCount === "number" ? c.itemCount : p.itemCount } : p;
    });
  } catch {
    return PLAYLISTS;
  }
}

/**
 * Cover with a fallback chain that always ends in a real image:
 * live API cover → /api/yt-cover redirect (fresh signed custom cover) →
 * first video's maxres frame → its mq frame → hq frame cropped past the bars.
 * YouTube answers a missing size with a 120×90 grey placeholder (not an error),
 * so tiny images count as failures too.
 */
function coverCandidates(p: Playlist, live: string | null) {
  const v = p.fallbackVideo;
  const list = [
    live,
    `/api/yt-cover?id=${encodeURIComponent(p.id)}`,
    `https://i.ytimg.com/vi/${v}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${v}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${v}/hqdefault.jpg`,
  ].filter((u): u is string => !!u);
  return Array.from(new Set(list));
}

function Cover({ p, live, top }: { p: Playlist; live: string | null; top: boolean }) {
  const candidates = coverCandidates(p, live);
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  // a new live URL restarts the chain
  useEffect(() => {
    setI(0);
    setReady(false);
  }, [live]);
  const src = candidates[Math.min(i, candidates.length - 1)];
  const last = i >= candidates.length - 1;
  const next = () => {
    if (!last) {
      setReady(false);
      setI((n) => n + 1);
    } else setReady(true);
  };
  return (
    <img
      key={src}
      src={src}
      alt=""
      width={480}
      height={480}
      loading="eager"
      fetchPriority={top ? "high" : "auto"}
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      data-ready={ready || undefined}
      data-crop={src.includes("/hqdefault.") || undefined}
      onLoad={(e) => (e.currentTarget.naturalWidth <= 120 ? next() : setReady(true))}
      onError={next}
      className="pl-cover block h-full w-full rounded-[var(--radius-lg)] bg-paper-deep object-cover"
    />
  );
}

/** Five YouTube Music playlists as a swipeable stack of real covers. */
export function PlaylistShelf() {
  const [lists, setLists] = useState<Playlist[]>(readCache);
  const [order, setOrder] = useState<number[]>(() => PLAYLISTS.map((_, i) => i));
  const [live, setLive] = useState(false);
  const [liveCovers, setLiveCovers] = useState<Record<string, string>>({});
  const deckRef = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /** Refresh title, cover and count on every page load (covers are signed URLs). */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/yt-playlists?t=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) return;
        const data = await res.json();
        if (!alive || !Array.isArray(data?.playlists)) return;
        setLists((prev) => {
          const next = prev.map((p) => {
            const l = data.playlists.find((x: Partial<Playlist>) => x.id === p.id);
            return l
              ? {
                  ...p,
                  title: l.title || p.title,
                  itemCount: typeof l.itemCount === "number" ? l.itemCount : p.itemCount,
                }
              : p;
          });
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next.map(({ id, title, itemCount }) => ({ id, title, itemCount }))));
          } catch {
            /* private mode */
          }
          return next;
        });
        const covers: Record<string, string> = {};
        for (const l of data.playlists) if (l?.id && typeof l.thumbnail === "string") covers[l.id] = l.thumbnail;
        setLiveCovers(covers);
        setLive(true);
      } catch {
        /* keep the cache */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Send the top card to the back (dir -1 brings the last one forward). */
  const cycle = useCallback((dir: 1 | -1) => {
    setOrder((o) => (dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));
  }, []);

  /* Drag the top card 1:1, fly it out past the threshold, else spring back.
     Animations run through WAAPI and every inline style is cleared when they
     finish. The old version left `transition: none` inline on each card it
     flew out, so once every card had gone round once the stack stopped
     animating. */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    let card: HTMLElement | null = null;
    let id = -1;
    let x0 = 0;
    let t0 = 0;
    let dx = 0;
    let dragging = false;
    let busy = false;
    const EASE_OUT = "cubic-bezier(.22,1,.36,1)";

    const topCard = () => deck.querySelector<HTMLElement>('[data-top="true"]');
    const clear = (el: HTMLElement) => {
      el.style.removeProperty("transform");
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
    };
    const dragT = (d: number) => `translate3d(${d}px,0,0) rotate(${(d * 0.06).toFixed(2)}deg) rotateY(${(d * -0.08).toFixed(2)}deg)`;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || busy) return;
      card = topCard();
      if (!card) return;
      id = e.pointerId;
      x0 = e.clientX;
      t0 = performance.now();
      dx = 0;
      dragging = false;
      card.setPointerCapture?.(id);
    };
    const move = (e: PointerEvent) => {
      if (!card || e.pointerId !== id) return;
      dx = e.clientX - x0;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        deck.dataset.dragging = "true";
      }
      if (!dragging) return;
      e.preventDefault();
      card.style.transition = "none";
      card.style.transform = dragT(dx);
    };
    const up = async (e: PointerEvent) => {
      if (!card || e.pointerId !== id) return;
      const el = card;
      const moved = Math.abs(dx);
      const v = moved / Math.max(1, performance.now() - t0);
      delete deck.dataset.dragging;
      card = null;
      if (!dragging) return; // a tap: the <a> handles it
      busy = true;
      try {
        if (moved > 90 || v > 0.5) {
          const dir = dx < 0 ? -1 : 1;
          let fly: Animation | null = null;
          if (!reduced) {
            fly = el.animate(
              [
                { transform: dragT(dx), opacity: 1 },
                { transform: `translate3d(${dir * 120}%,0,0) rotate(${dir * 12}deg)`, opacity: 0 },
              ],
              { duration: 350, easing: EASE_OUT, fill: "forwards" }
            );
            await fly.finished;
          }
          // The card stays invisible (fly fill) while the new order commits
          // synchronously, and the stack's CSS transition is muted on it so it
          // never slides visibly from the front slot to the back.
          el.style.transition = "none";
          flushSync(() => cycle(1));
          el.style.removeProperty("transform");
          el.style.removeProperty("opacity");
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
          // enter from behind; started before the fly fill is released, so no gap frame
          const enter = el.animate([{ opacity: 0, transform: "translate3d(0,0,-200px) scale(.8)" }, { opacity: 1 }], {
            duration: reduced ? 160 : 300,
            easing: "ease-out",
            composite: "add",
            fill: "backwards",
          });
          fly?.cancel();
          await enter.finished.catch(() => undefined);
          el.style.removeProperty("transition");
        } else {
          const back = el.animate([{ transform: dragT(dx) }, { transform: "none" }], { duration: 300, easing: EASE_OUT });
          clear(el);
          await back.finished;
        }
      } catch {
        clear(el);
      } finally {
        busy = false;
      }
    };

    deck.addEventListener("pointerdown", down);
    deck.addEventListener("pointermove", move);
    deck.addEventListener("pointerup", up);
    deck.addEventListener("pointercancel", up);
    return () => {
      deck.removeEventListener("pointerdown", down);
      deck.removeEventListener("pointermove", move);
      deck.removeEventListener("pointerup", up);
      deck.removeEventListener("pointercancel", up);
    };
  }, [cycle, reduced]);

  const top = lists[order[0]];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="My YouTube Music playlists — swipe or use the arrow keys"
      className="pl-deck-wrap"
    >
      <div
        ref={deckRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            cycle(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            cycle(-1);
          }
        }}
        className="pl-deck"
      >
        {order.map((li, depth) => {
          const p = lists[li];
          const isTop = depth === 0;
          return (
            <div
              key={p.id}
              data-top={isTop ? "true" : undefined}
              className="pl-stack-card"
              style={{ ["--d" as string]: depth, zIndex: order.length - depth }}
              aria-hidden={!isTop}
            >
              <a
                href={`https://music.youtube.com/playlist?list=${p.id}`}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                tabIndex={isTop ? 0 : -1}
                className="block h-full w-full rounded-[var(--radius-lg)]"
                aria-label={`${p.label}: ${p.title}${typeof p.itemCount === "number" ? `, ${p.itemCount} tracks` : ""} — open in YouTube Music`}
              >
                <Cover p={p} live={liveCovers[p.id] ?? null} top={depth === 0} />
              </a>
            </div>
          );
        })}
      </div>

      <div className="pl-meta" aria-live="polite">
        <p key={top?.id} className="m-swap">
          <span className="kicker block text-ink-soft">{top?.label}</span>
          <span className="mt-1 block truncate text-md text-ink">{top?.title}</span>
          {typeof top?.itemCount === "number" && (
            <span className="mt-0.5 block font-mono text-xs text-graphite tabular">
              {top.itemCount.toLocaleString("en-US")} tracks{live ? "" : ""}
            </span>
          )}
        </p>
        <p className="mt-2 font-mono text-xs text-graphite">Swipe the covers</p>
      </div>
    </div>
  );
}
