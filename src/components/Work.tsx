import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Download, GitFork, LifeBuoy, Lightbulb, Star, TriangleAlert } from "lucide-react";
import { cn } from "../utils/cn";
import { ago, useGithubRepo } from "../hooks/useGithubRepo";
import { usePointerVars } from "../hooks/usePointerVars";
import { useContent } from "../content/store";
import { Blocks, EField, EImage, EStringList, EText } from "../content/Editable";
import { Reveal } from "./Reveal";
import { BurstLines, GiantType, MotionVectors, SpinBadge } from "./AnimeFx";
import { Button, Kicker, SectionHead } from "./ui";

/* ---------------- ROM post ---------------- */

function RomPost() {
  const { content, editing } = useContent();
  const p = content.rom;
  const links = p.links.map((link, index) => ({ ...link, index }));
  const shownLinks = editing ? links : links.filter((link) => link.url.trim() !== "");
  const [primary, ...rest] = [...shownLinks.filter((link) => link.primary), ...shownLinks.filter((link) => !link.primary)];
  const linkLabel = (link: (typeof links)[number]) => (
    <EText path={`rom.links.${link.index}.label`} label={`ROM link ${link.index + 1} label`} />
  );

  return (
    <Reveal as="article" aria-labelledby="rom-title" className="overflow-hidden rounded-[var(--radius-xl)] border border-panel-rule bg-panel-2">
      <EImage srcPath="rom.thumbnail" altPath="rom.thumbnailAlt">
        {(src, alt) => (
          <img
            src={src}
            width={1672}
            height={941}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="block aspect-video h-auto w-full bg-panel-3 object-cover"
          />
        )}
      </EImage>

      <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:p-10">
        {/* Meta + links */}
        <div>
          <h3 id="rom-title" className="font-display text-page font-normal text-panel-text">
            <EText path="rom.title" label="ROM title" />
          </h3>
          <p className="mt-2 font-mono text-sm text-panel-text-2">
            <EText path="rom.codename" label="ROM codename" /> · <EText path="rom.variant" label="ROM variant" />
          </p>

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-panel-rule py-4 font-mono text-sm">
            <dt className="text-panel-muted"><EText path="rom.releasedLabel" label="Release label" /></dt>
            <dd className="text-panel-text">
              <time dateTime={p.date}><EText path="rom.dateLabel" label="Release date" /></time>
            </dd>
            <dt className="text-panel-muted"><EText path="rom.maintainerLabel" label="Maintainer label" /></dt>
            <dd>
              <a
                href={p.maintainerUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => editing && event.preventDefault()}
                className="-my-3 inline-flex min-h-11 items-center text-panel-text underline decoration-panel-rule underline-offset-4 transition-colors duration-[var(--dur-2)] hover:decoration-panel-text"
              >
                <EText path="rom.maintainer" label="ROM maintainer" />
              </a>
            </dd>
          </dl>
          <EField path="rom.maintainerUrl" label="Maintainer link URL" type="url" />

          <div className="mt-6 flex flex-col gap-3">
            {primary && (primary.url ? (
              <Button
                href={primary.url}
                target="_blank"
                rel="noreferrer"
                variant="accent"
                className="w-full"
                onClick={(event) => editing && event.preventDefault()}
              >
                <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                {linkLabel(primary)}
              </Button>
            ) : editing ? <span className="inline-flex min-h-11 items-center gap-2 font-mono text-xs text-panel-muted">Primary link · {linkLabel(primary)}</span> : null)}
            {rest.map((link) => link.url ? (
              <Button
                key={link.index}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                className="w-full hover:bg-[#f3efe614]"
                onClick={(event) => editing && event.preventDefault()}
              >
                {link.label === "Support" ? (
                  <LifeBuoy aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                )}
                {linkLabel(link)}
              </Button>
            ) : editing ? <span key={link.index} className="inline-flex min-h-11 items-center font-mono text-xs text-panel-muted">{linkLabel(link)}</span> : null)}
          </div>
          {editing && (
            <div className="mt-3 flex flex-col gap-2">
              {p.links.map((link, index) => <EField key={index} path={`rom.links.${index}.url`} label={`${link.label || `ROM link ${index + 1}`} URL`} type="url" />)}
            </div>
          )}
        </div>

        {/* Changelog, tip, notes, warning */}
        <div className="flex flex-col gap-8">
          <section aria-labelledby="rom-changelog">
            <Kicker>
              <span id="rom-changelog"><EText path="rom.changelogLabel" label="Changelog label" /></span>
            </Kicker>
            <EStringList
              path="rom.changelog"
              as="ol"
              className="scroll-stagger mt-3 border-t border-panel-rule"
              itemClassName="flex gap-4 border-b border-panel-rule py-3 text-[16px] leading-[1.6] text-panel-text"
              textClassName="text-panel-text"
              itemLabel="changelog item"
              numbered
            />
          </section>

          <div className="flex gap-3 rounded-[var(--radius-md)] border border-panel-rule bg-panel-3 p-4">
            <Lightbulb aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-panel-ok" strokeWidth={1.75} />
            <p className="text-[16px] leading-[1.6] text-panel-text-2">
              <strong className="font-semibold text-panel-text"><EText path="rom.tipLabel" label="Tip label" />:</strong>{" "}
              <EText path="rom.tip" multiline label="ROM tip" />
            </p>
          </div>

          <section aria-labelledby="rom-notes">
            <Kicker>
              <span id="rom-notes"><EText path="rom.notesLabel" label="Notes label" /></span>
            </Kicker>
            <EText path="rom.notesLead" as="p" className="mt-3 block text-[16px] font-semibold leading-[1.6] text-panel-text" label="Notes introduction" />
            <EStringList
              path="rom.notes"
              className="scroll-stagger mt-3 flex flex-col gap-3"
              itemClassName="flex gap-3 text-[16px] leading-[1.6] text-panel-text-2"
              textClassName="text-panel-text-2"
              itemLabel="ROM note"
              bullet
            />
          </section>

          <div role="note" className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--warn-bg)] p-4 text-[var(--warn-fg)]">
            <TriangleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} />
            <p className="text-[16px] leading-[1.6]">
              <strong className="font-semibold"><EText path="rom.warningLabel" label="Warning label" />:</strong>{" "}
              <EText path="rom.warning" multiline label="ROM warning" />
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- ArchiveTune with live stars ---------------- */

/** A number that rises 6px when it changes. */
function LiveNumber({ value }: { value: number | null }) {
  return (
    <span key={value ?? "none"} className="m-rise inline-block tabular" style={{ ["--rise-y" as string]: "6px", ["--m-dur" as string]: "var(--dur-3)" }}>
      {value === null ? "—" : value.toLocaleString("en-US")}
    </span>
  );
}

function AppCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { content, editing } = useContent();
  const app = content.app;
  const { stats, checkedAt } = useGithubRepo(app.repo, ref);
  usePointerVars(ref);
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 10_000);
    return () => window.clearInterval(id);
  }, []);
  const lastCheck = checkedAt ?? stats?.ts ?? null;

  return (
    <Reveal>
      <div ref={ref} className="scroll-stack-layer grid gap-8 rounded-[var(--radius-xl)] border border-panel-rule p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:p-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-panel-err">
            <EText path="app.name" label="App name" /> <span className="text-panel-muted">· <EText path="app.sector" label="App category" /></span>
          </p>
          <EText path="app.title" as="h3" className="mt-3 block font-display text-page font-normal text-panel-text" label="App title" />
          <EText path="app.desc" as="p" multiline className="mt-4 block text-lg text-panel-text-2" label="App description" />
          <EStringList
            path="app.tags"
            className="scroll-stagger mt-5 flex flex-wrap gap-1.5"
            itemClassName="rounded-full border border-panel-rule px-2.5 py-1 font-mono text-xs text-panel-text-2"
            textClassName="text-panel-text-2"
            itemLabel="technology tag"
          />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <dl aria-live="polite" className="grid grid-cols-2 divide-x divide-panel-rule border-y border-panel-rule">
            <div className="flex flex-col-reverse py-4 pr-4">
              <dt className="mt-1 flex items-center gap-1.5 font-mono text-xs text-panel-muted">
                <Star aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} /> stars on GitHub
              </dt>
              <dd className="font-mono text-[clamp(36px,2.4vw+20px,52px)] leading-none text-panel-text">
                <LiveNumber value={stats?.stars ?? null} />
              </dd>
            </div>
            <div className="flex flex-col-reverse py-4 pl-4">
              <dt className="mt-1 flex items-center gap-1.5 font-mono text-xs text-panel-muted">
                <GitFork aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} /> forks
              </dt>
              <dd className="font-mono text-[clamp(36px,2.4vw+20px,52px)] leading-none text-panel-text">
                <LiveNumber value={stats?.forks ?? null} />
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs text-panel-muted">
              {lastCheck ? (
                <>
                  <span aria-hidden className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", checkedAt ? "bg-panel-ok" : "bg-panel-muted")} />
                  live · checked {ago(Date.now() - lastCheck)}
                </>
              ) : (
                "loading from api.github.com…"
              )}
            </p>
            <a
              href={app.link}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => editing && event.preventDefault()}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-panel-text underline decoration-panel-rule underline-offset-4 transition-colors duration-[var(--dur-2)] hover:decoration-panel-text"
            >
              <EText path="app.linkLabel" label="App link label" />
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <EField path="app.link" label="App link URL" type="url" />
            <EField path="app.repo" label="GitHub stats repository (owner/repo)" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="panel-scope relative overflow-clip">
      <GiantType className="top-10 lg:top-20" />
      <BurstLines className="top-0" />
      <div className="page relative py-24 lg:py-32">
        <SpinBadge className="fx-badge top-20 right-[var(--gutter)] lg:top-24" />
        <MotionVectors className="fx-mv top-28 right-[var(--gutter)]" count={5} />
        <SectionHead
          className="max-md:pr-24"
          num="01"
          label={<EText path="work.sectionLabel" label="Work section label" />}
          title={
            <span id="work-title">
              <EText path="work.titleLine1" label="Work heading line one" />
              <br />
              <EText path="work.titleLine2" label="Work heading line two" />{" "}
              <em className="ital"><EText path="work.titleEmphasis" label="Work heading emphasis" /></em>.
            </span>
          }
        />
        <div className="scroll-stack">
          <div className="scroll-stack-card"><RomPost /></div>
          <div className="scroll-stack-card"><AppCard /></div>
        </div>
        <Blocks section="work" />
      </div>
    </section>
  );
}
