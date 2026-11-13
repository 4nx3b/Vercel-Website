import { useEffect, useState } from "react";

export type ScrollChapter = { id: string; href: string; label: string; identity?: string };

/** A quiet editorial chapter rail that tracks the section passing the reading line. */
export function ScrollIndex({ chapters }: { chapters: ScrollChapter[] }) {
  const [active, setActive] = useState(chapters[0]?.id || "");
  const signature = chapters.map((chapter) => `${chapter.id}:${chapter.href}:${chapter.identity || ""}`).join("|");

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-chapter]"));
    if (!nodes.length) return;

    const selectNearest = () => {
      const marker = window.innerHeight * 0.4;
      let nearest: HTMLElement | undefined;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        const distance = marker < rect.top ? rect.top - marker : marker > rect.bottom ? marker - rect.bottom : 0;
        if (distance < nearestDistance) {
          nearest = node;
          nearestDistance = distance;
        }
      }
      const id = nearest?.dataset.scrollChapter;
      if (id) setActive((current) => current === id ? current : id);
    };

    if (typeof IntersectionObserver === "undefined") {
      let raf = 0;
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0;
          selectNearest();
        });
      };
      selectNearest();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      };
    }

    const visible = new Map<Element, IntersectionObserverEntry>();
    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      visible.clear();
      const height = window.innerHeight;
      // Root-margin percentages resolve against width; use pixels to make a slim 40%-height reading line.
      const top = Math.round(height * 0.38);
      const bottom = Math.round(height * 0.58);
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target, entry);
          else visible.delete(entry.target);
        }
        const candidates = Array.from(visible.values());
        if (!candidates.length) return;
        const marker = window.innerHeight * 0.4;
        candidates.sort((a, b) => {
          const distance = (entry: IntersectionObserverEntry) =>
            marker < entry.boundingClientRect.top
              ? entry.boundingClientRect.top - marker
              : marker > entry.boundingClientRect.bottom
                ? marker - entry.boundingClientRect.bottom
                : 0;
          return distance(a) - distance(b);
        });
        const chapter = (candidates[0].target as HTMLElement).dataset.scrollChapter;
        if (chapter) setActive((current) => current === chapter ? current : chapter);
      }, { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 });
      nodes.forEach((node) => observer?.observe(node));
    };

    observe();
    window.addEventListener("resize", observe, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [signature]);

  if (chapters.length < 2) return null;
  return (
    <nav className="scroll-index" aria-label="Page sections">
      <span className="scroll-index-caption">Index</span>
      <ol className="scroll-index-list">
        {chapters.map((chapter, index) => {
          const current = active === chapter.id;
          return (
            <li key={chapter.id} data-active={current || undefined}>
              <a href={chapter.href} aria-current={current ? "location" : undefined} aria-label={`${String(index + 1).padStart(2, "0")} · ${chapter.label}`}>
                <span className="scroll-index-number">{String(index + 1).padStart(2, "0")}</span>
                <span aria-hidden className="scroll-index-mark" />
                <span className="scroll-index-title">{chapter.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
