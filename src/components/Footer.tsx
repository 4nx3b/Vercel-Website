import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useIstClock } from "../hooks/useInView";
import { StatusDot } from "./ui";
import { useScrollVar } from "../hooks/useScrollVar";
import { FooterFlow } from "./AnimeFx";

/** Decorative signature, one span per letter for the hover play (aria-hidden). */
const SIGNATURE = Array.from("v3rsi0n.");


/** Closing key visual (user-supplied), resized to webp in public/art. */
const BAND = {
  src1280: "art/footer-band-1280.webp",
  src1920: "art/footer-band-1920.webp",
  width: 1280,
  height: 720,
  alt: "Anime key visual: four bandmates carrying guitar cases across a sunlit crosswalk",
};

function ArtBand() {
  const ref = useRef<HTMLElement>(null);
  useScrollVar(ref);
  return (
    <figure ref={ref} className="art-band relative m-0 overflow-clip border-b border-ink bg-paper-deep">
      <picture>
        <source type="image/webp" srcSet={`${BAND.src1280} 1280w, ${BAND.src1920} 1920w`} sizes="100vw" />
        <img
          src={BAND.src1280}
          width={BAND.width}
          height={BAND.height}
          alt={BAND.alt}
          loading="lazy"
          decoding="async"
          className="block aspect-video max-h-[70vh] min-h-[320px] w-full object-cover object-[right_bottom] sm:object-center"
        />
      </picture>
      <figcaption className="relative p-4 sm:absolute sm:p-0 sm:top-1/2 sm:left-[max(var(--gutter),calc((100vw-var(--page-max))/2+var(--gutter)))] sm:max-w-[380px] sm:-translate-y-1/2">
        <div className="rounded-[var(--radius-xs)] border border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)]">
          <p className="kicker text-ink-soft">End of transmission</p>
          <p className="mt-2 font-display text-title text-ink sm:text-[30px] sm:leading-[1.1]">Thanks for scrolling. Go flash something.</p>
          <div className="mt-4 flex flex-wrap gap-x-5">
            {[
              { name: "Telegram", url: "https://t.me/v3rsi0n" },
              { name: "GitHub", url: "https://github.com/4nx3b" },
            ].map((l) => (
              <a
                key={l.name}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-1.5 text-md font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
              >
                {l.name}
                <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Footer() {
  const clock = useIstClock();
  return (
    <footer className="relative overflow-clip border-t border-ink bg-paper">
      <ArtBand />
      <div className="relative">
      <FooterFlow />
      <div className="page relative pt-16">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-rule-strong bg-paper/70 px-4 py-2">
            <StatusDot tone="moss" label="Open for collabs" />
            <span aria-hidden className="h-3 w-px bg-rule-strong" />
            <span className="font-mono text-xs text-graphite tabular">IST {clock}</span>
          </div>
        </div>

        <div className="relative mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
          <span className="font-mono text-xs text-graphite">© 2026 v3rsi0n</span>
          <span className="font-mono text-xs text-graphite">Versioned in public, tested on real hardware.</span>
        </div>
        {/* Giant clipped signature */}
        <p
          aria-hidden
          className="sig mt-12 -mb-[0.24em] select-none whitespace-nowrap font-display leading-[0.8] tracking-[-0.03em]"
          style={{ fontSize: "clamp(80px, 16vw, 240px)" }}
        >
          {SIGNATURE.map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>

      </div>
      </div>
    </footer>
  );
}
