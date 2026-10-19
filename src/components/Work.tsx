import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { LUNARIS, PROJECTS, REPOS, type Repo } from "../lib/data";
import { ArrowUpRight, SearchIcon } from "./icons";
import { ButtonGhostDark, MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";
import poster from "../assets/reze/lunaris-poster.jpg";

/** Live repo table — pulls from the GitHub API, falls back to the shipped snapshot. */
function RepoTable() {
  const [repos, setRepos] = useState<Repo[]>(REPOS);
  const [live, setLive] = useState(false);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("ALL");

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/users/4nx3b/repos?per_page=100&sort=pushed")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: any[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setRepos(
          data.map((d) => ({
            name: d.name,
            desc: d.description ?? "—",
            lang: d.language ?? "—",
            stars: d.stargazers_count,
            forks: d.forks_count,
            fork: d.fork,
            updated: String(d.pushed_at ?? "").slice(0, 10),
            url: d.html_url,
          }))
        );
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const langs = useMemo(() => ["ALL", ...Array.from(new Set(repos.map((r) => r.lang)))], [repos]);
  const filtered = repos.filter(
    (r) =>
      (lang === "ALL" || r.lang === lang) &&
      (query.trim() === "" || `${r.name} ${r.desc}`.toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-carbon-lift pt-6">
        <div className="flex items-center gap-2.5">
          <StatusDot tone={live ? "green" : "orange"} pulse={!live} />
          <MonoTag className="text-pale-stone">
            Repositories — {String(repos.length).padStart(2, "0")} public · {live ? "live — api.github.com" : "cached snapshot"}
          </MonoTag>
        </div>
        <label className="flex items-center gap-2 border border-carbon-lift px-3 py-2 transition-colors duration-150 focus-within:border-ash-stroke">
          <SearchIcon className="h-3.5 w-3.5 text-graphite-mid" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep repos…"
            aria-label="Search repositories"
            className="w-40 bg-transparent font-geist-mono text-caption uppercase tracking-[-0.02em] text-bone placeholder:text-graphite-mid focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {langs.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={cn(
              "rounded-sm px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150",
              lang === l ? "bg-chalk text-obsidian-canvas" : "border border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <ul className="mt-6 border-t border-carbon-lift">
        {filtered.map((r) => (
          <li key={r.name}>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-1 items-baseline gap-x-6 gap-y-1.5 border-b border-carbon-lift py-4 transition-colors duration-150 hover:bg-carbon-lift/30 sm:grid-cols-[180px_1fr_auto] sm:px-4"
            >
              <span className="flex items-center gap-2 font-geist-mono text-body-sm text-bone transition-colors duration-150 group-hover:text-chalk">
                {r.name}
                {r.fork && <span className="border border-carbon-lift px-1 py-0.5 text-[10px] uppercase tracking-[0.08em] text-graphite-mid">fork</span>}
              </span>
              <span className="truncate text-body-sm text-warm-granite">{r.desc}</span>
              <span className="flex items-center gap-4 font-geist-mono text-caption uppercase tracking-[-0.02em] text-graphite-mid tabular">
                <span className={r.lang === "Kotlin" ? "text-metric-green" : r.lang === "—" ? "" : "text-pale-stone"}>{r.lang}</span>
                <span>★ {r.stars}</span>
                <span className="hidden md:inline">{r.updated}</span>
                <ArrowUpRight className="h-3 w-3 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-pale-stone" />
              </span>
            </a>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="border-b border-carbon-lift py-6 text-center">
            <MonoTag className="text-graphite-mid">0 results — nothing matches that grep</MonoTag>
          </li>
        )}
      </ul>
    </div>
  );
}

export function Work() {
  return (
    <section id="work" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="03" title="Work" note="04 builds · 09 repos" />

      {/* Featured build — Lunaris OS */}
      <Reveal delay={60} className="mt-12">
        <div className="grain grid overflow-hidden rounded-2xl bg-bone lg:grid-cols-[1.15fr_1fr]">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="flex items-center gap-2.5">
              <StatusDot tone="orange" />
              <MonoTag className="text-obsidian-canvas">Featured build — Custom ROM</MonoTag>
            </div>

            <h3 className="mt-8 font-geist text-heading tracking-[-0.031em] text-obsidian-canvas lg:text-heading-lg">
              {LUNARIS.name}
            </h3>
            <MonoTag className="mt-3 block text-graphite-mid">
              {LUNARIS.variant} · build {LUNARIS.build}
            </MonoTag>

            <p className="mt-6 max-w-lg text-body text-graphite-mid">{LUNARIS.desc}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {LUNARIS.devices.map((d) => (
                <span key={d} className="border border-obsidian-canvas/25 px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-obsidian-canvas">
                  {d}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={LUNARIS.download}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-obsidian-canvas px-4 font-geist text-body-sm text-bone transition-colors duration-150 hover:bg-carbon-lift"
              >
                Download — read support first
              </a>
              <ButtonGhostDark href={LUNARIS.support}>Support — Telegram</ButtonGhostDark>
            </div>
          </div>

          {/* Poster in a dark inset — figure within the figure */}
          <div className="group relative flex items-center justify-center overflow-hidden bg-obsidian-canvas p-8 sm:p-10">
            <img
              src={poster}
              alt="Lunaris OS 3.11 Zephyr poster"
              className="max-h-[420px] w-auto rounded-sm border border-carbon-lift object-contain grayscale transition-[filter] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grayscale-0"
            />
            <MonoTag className="absolute bottom-4 left-4 text-graphite-mid">LUNARIS-POSTER.RAW</MonoTag>
            <MonoTag className="absolute right-4 top-4 text-graphite-mid">v3.11 · ZEPHYR</MonoTag>
          </div>
        </div>
      </Reveal>

      {/* Supporting builds */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((proj, i) => (
          <Reveal key={proj.index} delay={i * 70} className="h-full">
            <a
              href={proj.link}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col rounded-lg border border-carbon-lift p-5 transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-ash-stroke hover:bg-carbon-lift/40"
            >
              <div className="flex items-center justify-between">
                <MonoTag className="text-graphite-mid">{proj.index}</MonoTag>
                <MonoTag className="text-pale-stone">{proj.version}</MonoTag>
              </div>
              <MonoTag className="mt-6 block text-signal-orange">{proj.client}</MonoTag>
              <h3 className="mt-2 font-geist text-[20px] leading-[1.25] tracking-[-0.02em] text-bone">{proj.title}</h3>
              <p className="mt-2 flex-1 text-body-sm text-warm-granite">{proj.desc}</p>

              <dl className="mt-5 grid grid-cols-3 divide-x divide-carbon-lift border-y border-carbon-lift">
                {proj.metrics.map((m) => (
                  <div key={m.label} className="px-3 py-3 first:pl-0">
                    <dd className="font-geist text-[20px] tracking-[-0.02em] text-bone tabular">{m.value}</dd>
                    <dt className="mt-1 font-geist-mono text-[10px] uppercase tracking-[0.06em] text-graphite-mid">{m.label}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {proj.tags.map((t) => (
                  <span key={t} className="border border-carbon-lift px-2 py-1 font-geist-mono text-[10px] uppercase tracking-[0.06em] text-graphite-mid">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-carbon-lift pt-4">
                <MonoTag className="text-pale-stone transition-colors duration-150 group-hover:text-chalk">{proj.linkLabel}</MonoTag>
                <ArrowUpRight className="h-3 w-3 text-pale-stone transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk" />
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <RepoTable />
    </section>
  );
}
