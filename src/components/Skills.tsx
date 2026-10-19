import { useState } from "react";
import { cn } from "../utils/cn";
import { CAT_TONE, SKILLS, SKILL_CATS } from "../lib/data";
import { SkillGlyphs } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

export function Skills() {
  const [cat, setCat] = useState("ALL");
  const filtered = cat === "ALL" ? SKILLS : SKILLS.filter((s) => s.cat === cat);

  return (
    <section id="skills" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="02" title="Skills" note="12 loaded · 5 categories" />

      <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
        <Reveal>
          <h2 className="max-w-xl font-geist text-heading-lg tracking-[-0.025em] text-bone">
            Everything between the bootloader and the daily driver.
          </h2>
        </Reveal>

        {/* Category selector */}
        <Reveal delay={80}>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Skill categories">
            {SKILL_CATS.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-sm px-3 py-2 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  cat === c
                    ? "bg-chalk text-obsidian-canvas"
                    : "border border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                )}
              >
                {c}
                {c !== "ALL" && (
                  <span className="ml-1.5 text-graphite-mid">{SKILLS.filter((s) => s.cat === c).length}</span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Grid replays its entrance on every filter change */}
      <div key={cat} className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill, i) => {
          const Glyph = SkillGlyphs[skill.glyph];
          const tone = CAT_TONE[skill.cat];
          return (
            <div
              key={skill.index}
              style={{ animation: `fade-up 0.22s cubic-bezier(0.4,0,0.2,1) ${i * 45}ms both` }}
              className="group flex flex-col rounded-lg border border-carbon-lift p-5 transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-ash-stroke hover:bg-carbon-lift/40"
            >
              <div className="flex items-center justify-between">
                <MonoTag className="text-graphite-mid">{skill.index}</MonoTag>
                <Glyph className="h-5 w-5 text-pale-stone transition-colors duration-150 group-hover:text-signal-orange" />
              </div>
              <h3 className="mt-8 font-geist text-[20px] leading-[1.2] tracking-[-0.02em] text-bone">{skill.name}</h3>
              <p className="mt-2 flex-1 text-body-sm text-warm-granite">{skill.sub}</p>
              <div className="mt-6 flex items-center gap-2 border-t border-carbon-lift pt-4">
                <StatusDot tone={tone === "neutral" ? "green" : tone} className={tone === "neutral" ? "opacity-40" : ""} />
                <MonoTag className="text-pale-stone">{skill.cat}</MonoTag>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
