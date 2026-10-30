import { ArrowUpRight } from "lucide-react";
import { SKILLS } from "../lib/data";
import { Reveal } from "./Reveal";
import { Chip, SectionHead, StatusDot } from "./ui";

const GROUPS: { cat: string; name: string; title: string; chip: string; href: string }[] = [
  { cat: "CORE", name: "Core", title: "The layer under everything else.", chip: "fastboot flashing unlock · ok", href: "#process" },
  { cat: "ROOT", name: "Root", title: "Root that survives the next OTA.", chip: "12 modules loaded", href: "#process" },
  { cat: "ROM", name: "ROM", title: "Builds, ports and device trees.", chip: "lunch zephyr-userdebug ✓", href: "#work" },
  { cat: "TOOLS", name: "Tools", title: "Scripts that do the boring part.", chip: "adb sideload · 100%", href: "#work" },
  { cat: "DEV", name: "Dev", title: "Shipped in the open, on GitHub.", chip: "9 public repos", href: "#work" },
];

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="page py-24 lg:py-32">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHead
            num="01"
            label="Skills"
            title={
              <span id="skills-title">
                Everything below
                <br />
                the <em className="ital">launcher</em>.
              </span>
            }
            lede="Flashing someone else's zip is where most tinkering stops. My work starts at the partition table and climbs back up to a UI you can live with."
          />
          <Reveal delay={140}>
            <div className="mt-8 inline-flex rounded-full border border-rule-strong px-4 py-2.5">
              <StatusDot tone="moss" label="Anything with an unlockable bootloader" />
            </div>
          </Reveal>
        </div>

        <ol className="border-t border-ink">
          {GROUPS.map((g, i) => {
            const items = SKILLS.filter((s) => s.cat === g.cat);
            return (
              <Reveal as="li" key={g.cat} delay={i * 70} className="border-b border-rule">
                <div className="grid gap-x-8 gap-y-4 py-8 sm:grid-cols-[48px_1fr] md:grid-cols-[48px_minmax(0,1fr)_minmax(0,1.2fr)]">
                  <span className="pt-2 font-mono text-xs text-graphite tabular">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-page font-normal leading-none text-ink sm:text-[clamp(40px,3vw+14px,56px)]">{g.name}</h3>
                  <div className="sm:col-start-2 md:col-start-3">
                    <p className="text-lg font-semibold text-ink">{g.title}</p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {items.map((s) => (
                        <li key={s.index} className="text-lg text-ink-soft">
                          <span className="font-medium text-ink">{s.name}.</span> {s.sub}.
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <Chip>{g.chip}</Chip>
                      <a
                        href={g.href}
                        aria-label={`${g.name}: see where it shows up`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-[var(--dur-2)] hover:bg-[#14130f0d] hover:text-ink"
                      >
                        <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
