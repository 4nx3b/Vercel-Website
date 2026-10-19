import { useState } from "react";
import { cn } from "../utils/cn";
import { CAT_TONE, SKILLS, SKILL_CATS } from "../lib/data";
import { SkillGlyphs } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

/** Compact skill index — dense instrument rows instead of tall cards. */
export function Skills() {
  const [cat, setCat] = useState("ALL");
  const filtered = cat === "ALL" ? SKILLS : SKILLS.filter((s) => s.cat === cat);

  return (
    <section id="skills" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="02" title="Skills" note="12 loaded · 5 categories" />

      <Reveal>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-geist text-heading tracking-[-0.031em] text-bone">
            Bootloader to daily driver<span className="text-signal-orange">.</span>
          </h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Skill categories">
            {SKILL_CATS.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-sm px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  cat === c
                    ? "bg-chalk text-obsidian-canvas"
                    : "border border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                )}
              >
                {c}
                {c !== "ALL" && <span className="ml-1.5 opacity-60">{SKILLS.filter((s) => s.cat === c).length}</span>}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div key={cat} className="mt-8 grid gap-x-10 md:grid-cols-2">
        {filtered.map((skill, i) => {
          const Glyph = SkillGlyphs[skill.glyph];
          const tone = CAT_TONE[skill.cat];
          return (
            <div
              key={skill.index}
              style={{ animation: `fade-up 0.22s cubic-bezier(0.4,0,0.2,1) ${i * 30}ms both` }}
              className="group flex items-center gap-4 border-b border-carbon-lift py-3.5 transition-colors duration-150 hover:bg-carbon-lift/20 md:px-3"
            >
              <MonoTag className="w-6 shrink-0 text-graphite-mid tabular">{skill.index}</MonoTag>
              <Glyph className="h-4 w-4 shrink-0 text-pale-stone transition-colors duration-150 group-hover:text-signal-orange" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-geist text-body-sm text-bone transition-colors duration-150 group-hover:text-chalk">
                  {skill.name}
                </p>
                <p className="truncate font-geist-mono text-[11px] tracking-[-0.02em] text-graphite-mid">{skill.sub}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                <StatusDot tone={tone === "neutral" ? "green" : tone} className={tone === "neutral" ? "opacity-40" : ""} />
                <MonoTag className="text-pale-stone">{skill.cat}</MonoTag>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
