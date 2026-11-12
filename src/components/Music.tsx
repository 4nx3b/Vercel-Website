import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYLISTS, type Playlist } from "../lib/data";

/* ---------------- Playlist shelf ---------------- */

const CACHE_KEY = "yt_playlists_v1";

function readCache(): Playlist[] {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    if (!v) return PLAYLISTS;
    const cached = JSON.parse(v) as Partial<Playlist>[];
    return PLAYLISTS.map((p) => ({ ...p, ...(cached.find((c) => c.id === p.id) ?? {}), label: p.label }));
  } catch {
    return PLAYLISTS;
  }
}

/** Five YouTube Music playlists as a swipeable stack of real covers. */
export function PlaylistShelf() {
  const [lists, setLists] = useState<Playlist[]>(readCache);
  const [order, setOrder] = useState<number[]>(() => PLAYLISTS.map((_, i) => i));
  const [live, setLive] = useState(false);
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
                  thumbnail: l.thumbnail || p.thumbnail,
                  itemCount: typeof l.itemCount === "number" ? l.itemCount : p.itemCount,
                }
              : p;
          });
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
          } catch {
            /* private mode */
          }
          return next;
        });
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
          if (!reduced) {
            const fly = el.animate(
              [
                { transform: dragT(dx), opacity: 1 },
                { transform: `translate3d(${dir * 120}%,0,0) rotate(${dir * 12}deg)`, opacity: 0 },
              ],
              { duration: 350, easing: EASE_OUT, fill: "forwards" }
            );
            await fly.finished;
            fly.cancel();
          }
          clear(el);
          cycle(1);
          // the card that went to the back fades up into its new slot
          requestAnimationFrame(() => {
            el.animate([{ opacity: 0, transform: "translate3d(0,0,-200px) scale(.8)" }, { opacity: 1 }], {
              duration: reduced ? 160 : 300,
              easing: "ease-out",
              composite: "add",
            });
          });
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
                <img
                  src={p.thumbnail}
                  alt=""
                  width={480}
                  height={480}
                  loading={depth > 1 ? "lazy" : "eager"}
                  decoding="async"
                  draggable={false}
                  className="pl-cover block h-full w-full rounded-[var(--radius-lg)] bg-paper-deep object-cover"
                />
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
