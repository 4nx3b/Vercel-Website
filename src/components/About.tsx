import { ABOUT_PARAS } from "../lib/data";
import { MonoTag, SectionHead } from "./ui";
import { Reveal } from "./Reveal";
import p01 from "../assets/reze/reze-01.jpg";
import p02 from "../assets/reze/reze-02.jpg";
import p03 from "../assets/reze/reze-03.jpg";
import p04 from "../assets/reze/reze-04.jpg";
import p05 from "../assets/reze/reze-05.jpg";
import p06 from "../assets/reze/reze-06.jpg";
import p07 from "../assets/reze/reze-07.jpg";
import p08 from "../assets/reze/reze-08.jpg";
import p09 from "../assets/reze/reze-09.jpg";
import p10 from "../assets/reze/reze-10.jpg";

const FRAMES = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-[1200px] px-6 py-24 lg:py-28">
      <SectionHead index="01" title="About" note="Operator profile · IST" />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="font-geist text-heading-lg tracking-[-0.025em] text-bone">
              Rooted since day one<span className="text-signal-orange">.</span>
            </h2>
          </Reveal>
          <div className="mt-8 space-y-5">
            {ABOUT_PARAS.map((para, i) => (
              <Reveal key={i} delay={i * 70}>
                <p className={i === 0 ? "text-body text-pale-stone" : "text-body text-warm-granite"}>{para}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={220}>
            <MonoTag className="mt-8 block text-graphite-mid">— therealreze · Android root specialist · IST GMT+5:30</MonoTag>
          </Reveal>
        </div>

        {/* Filmstrip — ten frames of the namesake, drained of color until touched */}
        <Reveal delay={100}>
          <div className="flex items-center justify-between">
            <MonoTag className="text-pale-stone">Plates 01–10 — Reze</MonoTag>
            <MonoTag className="text-graphite-mid">Drag / hover to develop</MonoTag>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FRAMES.map((src, i) => (
              <figure key={i} className="group relative shrink-0">
                <img
                  src={src}
                  alt={`Reze frame ${String(i + 1).padStart(2, "0")}`}
                  loading="lazy"
                  className="h-56 w-40 rounded-sm border border-carbon-lift object-cover grayscale transition-[filter,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-ash-stroke group-hover:grayscale-0"
                />
                <figcaption className="absolute bottom-2 left-2 bg-obsidian-canvas/85 px-1.5 py-1 font-geist-mono text-[10px] uppercase tracking-[0.08em] text-pale-stone">
                  {String(i + 1).padStart(2, "0")}
                </figcaption>
              </figure>
            ))}
          </div>
          <MonoTag className="mt-1 block text-graphite-mid">10 frames · 35mm · the namesake</MonoTag>
        </Reveal>
      </div>
    </section>
  );
}
