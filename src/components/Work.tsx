import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { PROJECTS, REPOS, type Repo } from "../lib/data";
import { ArrowUpRight, SearchIcon } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

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
    <div className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-carbon-lift pt-6">
        <div className="flex items-center gap-2.5">
          <StatusDot tone={live ? "green" : "orange"} pulse={!live} />
          <MonoTag className="text-pale-stone">
            Repositories — {String(repos.length).padStart(2, "0")} public · {live ? "live — api.github.com" : "cached snapshot"}
          </MonoTag>
        </div>
        <label className="flex items-center gap-2 border border-carbon-lift bg-carbon-lift/20 px-3 py-2 backdrop-blur-sm transition-colors duration-150 focus-within:border-ash-stroke">
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

      <ul className="mt-5 border-t border-carbon-lift">
        {filtered.map((r) => (
          <li key={r.name}>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-1 items-baseline gap-x-6 gap-y-1.5 border-b border-carbon-lift py-3.5 transition-colors duration-150 hover:bg-carbon-lift/30 sm:grid-cols-[180px_1fr_auto] sm:px-4"
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
      <SectionHead index="03" title="Work" note="03 builds · 09 repos" />

      <Reveal>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-geist text-heading tracking-[-0.031em] text-bone">
            Shipped, starred, versioned in public.
          </h2>
          <p className="max-w-sm text-body-sm text-warm-granite">
            Every build below lives on GitHub — named, dated, and reproducible from source.
          </p>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((proj, i) => (
          <Reveal key={proj.index} delay={i * 70} className="h-full">
            <a
              href={proj.link}
              target="_blank"
              rel="noreferrer"
              className="lift group flex h-full flex-col rounded-lg border border-carbon-lift bg-carbon-lift/15 p-5 backdrop-blur-sm hover:border-ash-stroke"
            >
              <div className="flex items-center justify-between">
                <MonoTag className="text-graphite-mid">{proj.index}</MonoTag>
                <MonoTag className="text-pale-stone">{proj.version}</MonoTag>
              </div>
              <MonoTag className="mt-5 block text-signal-orange">{proj.client}</MonoTag>
              <h3 className="mt-2 font-geist text-[19px] leading-[1.25] tracking-[-0.02em] text-bone">{proj.title}</h3>
              <p className="mt-2 flex-1 text-body-sm text-warm-granite">{proj.desc}</p>

              <dl className="mt-4 grid grid-cols-3 divide-x divide-carbon-lift border-y border-carbon-lift">
                {proj.metrics.map((m) => (
                  <div key={m.label} className="px-2.5 py-2.5 first:pl-0">
                    <dd className="font-geist text-[18px] tracking-[-0.02em] text-bone tabular">{m.value}</dd>
                    <dt className="mt-1 font-geist-mono text-[10px] uppercase tracking-[0.06em] text-graphite-mid">{m.label}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {proj.tags.map((t) => (
                  <span key={t} className="border border-carbon-lift px-2 py-1 font-geist-mono text-[10px] uppercase tracking-[0.06em] text-graphite-mid">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-carbon-lift pt-3.5">
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
