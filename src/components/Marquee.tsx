import { TICKER_ITEMS } from "../lib/data";

/** Status ticker — mono dispatches drifting on a slow loop, square separators. */
export function Marquee() {
  const row = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section aria-label="Status ticker" className="border-y border-carbon-lift">
      <div className="mask-fade-x overflow-hidden py-10">
        <div className="flex w-max animate-marquee items-center gap-10 pr-10 hover:[animation-play-state:paused]">
          {row.map((item, i) => (
            <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-10">
              <span className="whitespace-nowrap font-geist-mono text-caption uppercase tracking-[0.06em] text-warm-granite transition-colors duration-150 hover:text-pale-stone">
                {item}
              </span>
              <span aria-hidden className="h-1.5 w-1.5 bg-signal-orange" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
