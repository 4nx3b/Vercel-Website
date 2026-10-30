import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Download, LifeBuoy, Pause, Play, Search } from "lucide-react";
import { cn } from "../utils/cn";
import { LUNARIS, PROJECTS, REPOS, TERMINAL_LINES, type Repo } from "../lib/data";
import { Reveal } from "./Reveal";
import { Button, Kicker, SectionHead, StatusDot } from "./ui";
import { useTicker } from "../hooks/useTicker";

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
    <Reveal className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker>Repositories</Kicker>
          <h3 className="mt-3 font-display text-page font-normal text-panel-text">
            {String(repos.length).padStart(2, "0")} public, all reproducible.
          </h3>
          <StatusDot
            className="mt-3"
            tone={live ? "ok" : "vermilion"}
            label={live ? "Live from api.github.com" : "Cached snapshot (API unreachable)"}
          />
        </div>
        <div>
          <label htmlFor="repo-search" className="mb-2 block font-mono text-xs text-panel-text-2">
            Search repositories
          </label>
          <div className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 focus-within:border-panel-text focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-panel-text">
            <Search aria-hidden className="h-4 w-4 text-panel-muted" strokeWidth={1.75} />
            <input
              id="repo-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="grep repos…"
              className="min-h-11 w-44 bg-transparent font-mono text-[16px] text-panel-text placeholder:text-panel-muted outline-none sm:text-md"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by language">
        {langs.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={cn(
              "min-h-11 rounded-full border px-3.5 font-mono text-xs transition-colors duration-[var(--dur-2)]",
              lang === l
                ? "border-panel-text bg-panel-text text-ink"
                : "border-[var(--border-strong)] text-panel-text-2 hover:border-panel-text hover:text-panel-text"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-panel-text">
        <div className="hidden grid-cols-[minmax(0,220px)_minmax(0,1fr)_110px_56px_110px_24px] gap-6 border-b border-panel-rule py-3 font-mono text-xs uppercase tracking-[0.12em] text-panel-muted sm:grid">
          <span>Name</span>
          <span>Description</span>
          <span>Lang</span>
          <span className="text-right">★</span>
          <span className="hidden md:block">Updated</span>
          <span />
        </div>
        <ul>
          {filtered.map((r) => (
            <li key={r.name}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1.5 border-b border-panel-rule py-4 transition-colors duration-[var(--dur-2)] hover:bg-[#f3efe60a] sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_110px_56px_110px_24px]"
              >
                <span className="flex min-w-0 items-center gap-2 font-mono text-md text-panel-text [overflow-wrap:anywhere]">
                  {r.name}
                  {r.fork && (
                    <span className="rounded-full border border-panel-rule px-1.5 py-px text-xs uppercase tracking-[0.06em] text-panel-muted">fork</span>
                  )}
                </span>
                <ArrowUpRight aria-hidden className="h-4 w-4 justify-self-end text-panel-muted group-hover:text-panel-text sm:order-last" strokeWidth={1.75} />
                <span className="col-span-2 text-sm text-panel-text-2 sm:col-span-1 sm:truncate">{r.desc}</span>
                <span className="font-mono text-xs text-panel-text-2">{r.lang}</span>
                <span className="font-mono text-xs text-panel-text-2 tabular sm:text-right">★ {r.stars}</span>
                <span className="hidden font-mono text-xs text-panel-muted tabular md:block">{r.updated}</span>
              </a>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="border-b border-panel-rule py-8 text-center font-mono text-xs text-panel-muted">
              0 results. Nothing matches that grep.
            </li>
          )}
        </ul>
      </div>
    </Reveal>
  );
}

/** Build stages; `time` is the logged duration shown once a stage is done. */
const BUILD_STEPS: { label: string; time: string }[] = [
  { label: "repo sync", time: "0:42" },
  { label: "lunch zephyr-userdebug", time: "1:10" },
  { label: "m bacon", time: "38:12" },
  { label: "sign target files", time: "39:01" },
  { label: "flash test on device", time: "4:20" },
  { label: "release", time: "0:08" },
];
/** At rest (and under reduced motion) the build sits on the flash test. */
const START_STAGE = 4;
/** Mirrors --tick-stage */
const TICK_STAGE_MS = 2400;

function BuildWindow() {
  const winRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const { stage, paused, setPaused, reduced } = useTicker(winRef, clockRef, {
    period: TICK_STAGE_MS,
    stages: BUILD_STEPS.length,
    start: START_STAGE,
  });

  return (
    <Reveal className="mt-14 overflow-hidden rounded-[var(--radius-xl)] border border-panel-rule bg-panel-2">
      <div ref={winRef} data-paused={paused ? "true" : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-rule px-5 py-3.5">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-panel-rule" />
            <span className="h-2.5 w-2.5 rounded-full border border-panel-rule" />
            <span className="h-2.5 w-2.5 rounded-full bg-vermilion" />
          </span>
          <span className="truncate font-mono text-xs text-panel-text-2">
            therealreze <span className="text-panel-muted">›</span> build · {LUNARIS.name} Zephyr
          </span>
        </span>
        <span className="flex items-center gap-3">
          <StatusDot tone="ok" label="Stable · 26 Jun 2026" className="text-panel-ok" />
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              aria-label="Pause build animation"
              className="-my-2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] text-panel-text-2 transition-colors duration-[var(--dur-2)] hover:border-panel-text hover:text-panel-text"
            >
              {paused ? (
                <Play aria-hidden className="h-4 w-4 translate-x-px" strokeWidth={1.75} />
              ) : (
                <Pause aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          )}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.8fr)]">
        {/* Build progress */}
        <div className="border-b border-panel-rule p-5 lg:border-r lg:border-b-0 lg:p-6">
          <Kicker>Build progress</Kicker>
          <ol className="mt-5 flex flex-col">
            {BUILD_STEPS.map((s, i) => {
              const state = i < stage ? "done" : i === stage ? "run" : "todo";
              return (
                <li key={s.label} className="flex items-center justify-between gap-4 border-b border-panel-rule py-3 last:border-b-0">
                  <span className="flex min-w-0 items-center gap-3">
                    {state === "done" ? (
                      <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-panel-ok" strokeWidth={2.25} />
                    ) : (
                      <span aria-hidden className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            state === "run" && "m-spark bg-vermilion",
                            state === "todo" && "border border-panel-muted"
                          )}
                        />
                      </span>
                    )}
                    <span className={cn("truncate text-sm", state === "todo" ? "text-panel-muted" : "text-panel-text")}>{s.label}</span>
                  </span>
                  <span className={cn("font-mono text-xs tabular", state === "run" ? "text-panel-err" : "text-panel-muted")}>
                    {state === "done" ? s.time : state === "run" ? <span ref={clockRef}>running</span> : "—"}
                    <span className="sr-only">{state === "done" ? ", done" : state === "run" ? ", in progress" : ", pending"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div aria-hidden className="mt-4 h-0.5 overflow-hidden rounded-full bg-panel-rule">
            <span className="m-step-slide block h-full w-2/5 bg-vermilion" />
          </div>
        </div>

        {/* Build note */}
        <div className="border-b border-panel-rule p-5 lg:border-r lg:border-b-0 lg:p-6">
          <Kicker>Build note</Kicker>
          <p className="mt-5 text-lg text-panel-text-2">{LUNARIS.desc}</p>
          <div className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-panel-rule bg-panel-3">
            <div className="flex items-center justify-between border-b border-panel-rule px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-panel-muted">
              <span>boot log</span>
              <span>zephyr · arm64</span>
            </div>
            <ol className="flex flex-col gap-1.5 px-4 py-4 font-mono text-xs leading-relaxed">
              {TERMINAL_LINES.map((l, i) => (
                <li
                  key={i}
                  className={cn(
                    "[overflow-wrap:anywhere]",
                    l.tone === "ok" && "text-panel-ok",
                    l.tone === "warn" && "text-panel-err",
                    l.tone === "prompt" && "text-panel-text"
                  )}
                >
                  <span aria-hidden className="mr-3 inline-block w-4 text-right text-panel-muted tabular">{i + 1}</span>
                  {l.text}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Devices */}
        <div className="flex flex-col p-5 lg:p-6">
          <Kicker>Devices</Kicker>
          <ul className="mt-5 flex flex-col">
            {LUNARIS.devices.map((d) => (
              <li key={d} className="border-b border-panel-rule py-3">
                <p className="font-display text-title text-panel-text">{d}</p>
                <p className="mt-1 font-mono text-xs text-panel-muted">{LUNARIS.variant}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <dt className="text-panel-muted">build</dt>
              <dd className="mt-1 text-panel-text">{LUNARIS.build}</dd>
            </div>
            <div>
              <dt className="text-panel-muted">root</dt>
              <dd className="mt-1 text-panel-text">Magisk · KSU</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 lg:mt-auto lg:pt-6">
            <Button href={LUNARIS.download} target="_blank" rel="noreferrer" variant="accent" className="w-full">
              <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              Download build
            </Button>
            <Button
              href={LUNARIS.support}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              className="w-full hover:bg-[#f3efe614]"
            >
              <LifeBuoy aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              Support on Telegram
            </Button>
          </div>
        </div>
      </div>
      </div>
    </Reveal>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="panel-scope">
      <div className="page py-24 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
          <SectionHead
            num="03"
            label="Work"
            title={
              <span id="work-title">
                Every build ships
                <br />
                with its <em className="ital">receipts</em>.
              </span>
            }
          />
          <Reveal delay={100}>
            <p className="max-w-[60ch] text-lede text-panel-text-2">
              ROMs, players and the site you are reading. Each one is named, dated and buildable from source,
              with the logs to prove it booted.
            </p>
          </Reveal>
        </div>

        <BuildWindow />

        {/* Projects */}
        <ol className="mt-20 border-t border-panel-text">
          {PROJECTS.map((proj, i) => (
            <Reveal as="li" key={proj.index} delay={i * 70} className="border-b border-panel-rule">
              <div className="grid gap-x-8 gap-y-5 py-10 md:grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)]">
                <span className="font-mono text-xs text-panel-muted tabular">{proj.index}</span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-panel-err">
                    {proj.client} <span className="text-panel-muted">· {proj.sector}</span>
                  </p>
                  <h3 className="mt-3 font-display text-page font-normal text-panel-text">{proj.title}</h3>
                  <p className="mt-2 font-mono text-xs text-panel-muted">{proj.version}</p>
                </div>
                <div className="md:col-start-3">
                  <p className="text-lg text-panel-text-2">{proj.desc}</p>
                  <dl className="mt-6 grid grid-cols-3 divide-x divide-panel-rule border-y border-panel-rule">
                    {proj.metrics.map((m) => (
                      <div key={m.label} className="flex flex-col-reverse py-3 pr-3 pl-3 first:pl-0">
                        <dt className="mt-1 font-mono text-xs text-panel-muted">{m.label}</dt>
                        <dd className="font-display text-title text-panel-text tabular">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <ul className="flex flex-wrap gap-1.5">
                      {proj.tags.map((t) => (
                        <li key={t} className="rounded-full border border-panel-rule px-2.5 py-1 font-mono text-xs text-panel-text-2">
                          {t}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-panel-text underline decoration-panel-rule underline-offset-4 transition-colors duration-[var(--dur-2)] hover:decoration-panel-text"
                    >
                      {proj.linkLabel}
                      <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <RepoTable />
      </div>
    </section>
  );
}
