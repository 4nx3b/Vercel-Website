import { TICKER_TOOLS } from "../lib/data";
import { cn } from "../utils/cn";

const STYLES = [
  "font-mono text-[15px] uppercase tracking-[0.16em] text-ink-soft",
  "font-display text-[24px] italic text-ink",
  "font-sans text-[18px] font-semibold tracking-[-0.01em] text-ink",
  "font-sans text-[19px] font-light text-ink-soft",
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-14 pr-14">
      {TICKER_TOOLS.map((t, i) => (
        <li key={t} className={cn("whitespace-nowrap leading-none", STYLES[i % STYLES.length])}>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Tool marquee — pauses on hover and focus, static under reduced motion. */
export function ToolStrip() {
  return (
    <section aria-label="Tools I work with" className="sunk-scope border-y border-rule">
      <div className="page flex flex-col gap-5 py-7 md:flex-row md:items-center md:gap-10">
        <p className="shrink-0 font-mono text-micro uppercase leading-relaxed tracking-[0.18em] text-ink-soft">
          Flashes, patches and tests
          <span className="block normal-case tracking-normal text-ink-soft">on real hardware</span>
        </p>
        <div className="m-marquee min-w-0 flex-1 py-3" tabIndex={0} role="region" aria-label="Tool list, pauses on focus">
          <div className="m-marquee-track">
            <Row />
            <Row hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
