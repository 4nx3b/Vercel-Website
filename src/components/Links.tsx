import { ArrowUpRight } from "lucide-react";
import { SOCIALS } from "../lib/data";
import { Reveal } from "./Reveal";
import { Kicker } from "./ui";

export function Links() {
  return (
    <section id="links" aria-labelledby="links-title" className="sunk-scope border-t border-rule">
      <div className="page grid gap-10 py-20 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:py-24">
        <Reveal>
          <Kicker className="text-ink-soft">Elsewhere</Kicker>
          <Reveal as="h2" id="links-title" variant="focus" delay={60} className="mt-4 font-display text-page font-normal text-ink">
            Twelve channels, all of them read.
          </Reveal>
          <p className="mt-4 max-w-[44ch] text-lg text-ink-soft">
            Telegram is fastest for build support. Everything else is where the anime, music and side projects live.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ul className="grid border-t border-ink sm:grid-cols-2 sm:gap-x-10">
            {SOCIALS.map((s) => (
              <li key={s.name} className="border-b border-rule">
                <a
                  href={s.url}
                  target={s.url.startsWith("#") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors duration-[var(--dur-2)]"
                >
                  <span className="text-lg text-ink group-hover:text-vermilion-ink">{s.name}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate font-mono text-xs text-ink-soft">{s.handle}</span>
                    <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-ink-soft group-hover:text-ink" strokeWidth={1.75} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
