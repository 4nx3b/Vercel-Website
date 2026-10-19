import { SOCIALS } from "../lib/data";
import { ArrowUpRight } from "./icons";
import { MonoTag, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

export function Links() {
  return (
    <section id="links" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="09" title="Links" note="12 channels · all monitored" />

      <div className="mt-12 grid gap-px border border-carbon-lift bg-carbon-lift sm:grid-cols-2 lg:grid-cols-3">
        {SOCIALS.map((s, i) => (
          <Reveal key={s.name} delay={i * 30} className="bg-obsidian-canvas">
            <a
              href={s.url}
              target={s.url.startsWith("#") ? undefined : "_blank"}
              rel="noreferrer"
              className="group flex h-full items-center justify-between gap-4 bg-obsidian-canvas p-5 transition-colors duration-150 hover:bg-carbon-lift/40"
            >
              <div>
                <p className="font-geist text-body-sm uppercase text-bone transition-colors duration-150 group-hover:text-chalk">{s.name}</p>
                <MonoTag className="mt-1 block text-graphite-mid">{s.handle}</MonoTag>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-graphite-mid transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-pale-stone" />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
