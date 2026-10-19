import { LIVE_SITE, NAV_LINKS, SOCIALS } from "../lib/data";
import { GitHubIcon, TelegramIcon } from "./icons";
import { MonoTag, StatusDot } from "./ui";
import { useIstClock } from "../hooks/useInView";

export function Footer() {
  const clock = useIstClock();
  const topChannels = SOCIALS.filter((s) => ["GitHub", "Telegram", "Discord", "Email"].includes(s.name));

  return (
    <footer id="company" className="relative overflow-hidden border-t border-carbon-lift">
      <div className="mx-auto max-w-[1200px] px-6 pt-24">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(2,1fr)] md:gap-9">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span aria-hidden className="h-2 w-2 bg-signal-orange" />
              <span className="font-geist-mono text-caption uppercase tracking-[0.18em] text-bone">therealreze</span>
            </a>
            <p className="mt-5 max-w-[260px] text-body-sm text-warm-granite">
              Android root specialist & custom ROM developer. The hardware answers to you.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <StatusDot tone="green" />
              <MonoTag className="text-pale-stone">Open for collabs</MonoTag>
            </div>
            <MonoTag className="mt-2 block text-graphite-mid tabular">IST {clock} · GMT+5:30</MonoTag>
            <a
              href={LIVE_SITE}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite underline decoration-ash-stroke underline-offset-4 transition-colors duration-150 hover:text-chalk"
            >
              therealreze.vercel.app
            </a>
          </div>

          <nav aria-label="Navigate">
            <h4 className="font-geist-mono text-caption font-medium uppercase tracking-[0.08em] text-bone">Navigate</h4>
            <ul className="mt-5 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-body-sm text-warm-granite transition-colors duration-150 hover:text-chalk">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#ask" className="text-body-sm text-warm-granite transition-colors duration-150 hover:text-chalk">Ask (AMA)</a>
              </li>
              <li>
                <a href="#links" className="text-body-sm text-warm-granite transition-colors duration-150 hover:text-chalk">Links</a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Channels">
            <h4 className="font-geist-mono text-caption font-medium uppercase tracking-[0.08em] text-bone">Channels</h4>
            <ul className="mt-5 space-y-3">
              {topChannels.map((s) => (
                <li key={s.name}>
                  <a href={s.url} target={s.url.startsWith("#") ? undefined : "_blank"} rel="noreferrer" className="text-body-sm text-warm-granite transition-colors duration-150 hover:text-chalk">
                    {s.name} — {s.handle}
                  </a>
                </li>
              ))}
              <li>
                <a href="https://github.com/4nx3b/Vercel-Website" target="_blank" rel="noreferrer" className="text-body-sm text-warm-granite transition-colors duration-150 hover:text-chalk">
                  Source
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Oversized watermark */}
        <div aria-hidden className="pointer-events-none mt-16 select-none overflow-hidden">
          <div className="translate-y-[18%] text-center font-geist text-[30vw] leading-[0.8] tracking-[-0.04em] text-carbon-lift md:text-[240px]">
            REZE
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-carbon-lift py-8 sm:flex-row">
          <MonoTag className="text-graphite-mid">© 2026 therealreze · built like a system, not a page</MonoTag>
          <div className="flex items-center gap-5">
            <MonoTag className="hidden text-graphite-mid sm:block">Factory chrome · SIGNAL data</MonoTag>
            <a href="https://github.com/4nx3b" target="_blank" rel="noreferrer" aria-label="GitHub" className="text-warm-granite transition-colors duration-150 hover:text-chalk">
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a href="https://t.me/therealreze" target="_blank" rel="noreferrer" aria-label="Telegram" className="text-warm-granite transition-colors duration-150 hover:text-chalk">
              <TelegramIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
