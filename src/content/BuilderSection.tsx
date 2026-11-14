import { ArrowUpRight } from "lucide-react";
import { cn } from "../utils/cn";
import { useContent, type BuilderBlock, type BuilderBackground, type BuilderLayout, type CustomPageSection } from "./store";
import { EImage, EText } from "./Editable";
import { Reveal } from "../components/Reveal";
import { Button, Kicker } from "../components/ui";

const safeHref = (value: string | undefined) => {
  const href = (value || "").trim();
  return /^https:\/\/[^\s<>]+$/i.test(href) || /^(?:mailto|tel):[^\s<>]+$/i.test(href) || /^#[\w-]+$/.test(href) ? href : "";
};
const safeImageSrc = (value: string | undefined) => {
  const src = value || "";
  return /^https:\/\/[^\s<>]+$/i.test(src) || /^\/api\/site-content\?image=[\w%.-]+$/.test(src) || /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(src) ? src : "";
};

function ProjectTile({ source, background }: { source: "rom" | "app"; background: BuilderBackground }) {
  const { content, editing } = useContent();
  const rom = source === "rom";
  const primaryIndex = content.rom.links.findIndex((link) => link.primary);
  const releaseLink = primaryIndex >= 0 ? content.rom.links[primaryIndex] : content.rom.links[0];
  const href = safeHref(rom ? releaseLink?.url : content.app.link);
  const surface = cn(background === "panel" && "builder-project--panel", !rom && "builder-project--app");
  const foreground = background === "panel" ? "text-panel-text" : "text-ink";
  const quiet = background === "panel" ? "text-panel-text-2" : "text-ink-soft";
  const kicker = background === "panel" ? "text-panel-err" : "text-vermilion-ink";
  return (
    <article className={cn("builder-project", surface)}>
      {rom && (
        <EImage srcPath="rom.thumbnail" altPath="rom.thumbnailAlt">
          {(src, alt) => src ? <img src={src} alt={alt} loading="lazy" decoding="async" className="builder-project-image" /> : <div className="builder-project-image builder-project-image--empty">Project image</div>}
        </EImage>
      )}
      <div className="builder-project-copy">
        <span className={cn("kicker", kicker)}><EText path={rom ? "rom.codename" : "app.name"} label="Existing project label" /></span>
        <EText path={rom ? "rom.title" : "app.title"} as="h3" className={cn("mt-2 block font-display text-title font-normal", foreground)} label="Existing project title" />
        <p className={cn("mt-2 font-mono text-xs", quiet)}>
          {rom ? <><EText path="rom.variant" label="ROM variant" /> · <EText path="rom.dateLabel" label="Release date" /></> : <EText path="app.sector" label="App category" />}
        </p>
        <EText path={rom ? "rom.notesLead" : "app.desc"} as="p" multiline className={cn("mt-4 block max-w-[52ch] leading-relaxed", quiet)} label="Existing project description" />
        {href && (
          <Button href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noreferrer" : undefined} variant={rom ? "accent" : "ink"} className="mt-5 min-h-11 px-5" onClick={(event) => editing && event.preventDefault()}>
            <EText path={rom ? `rom.links.${Math.max(0, primaryIndex)}.label` : "app.linkLabel"} fallback={rom ? releaseLink?.label || "Explore the release" : content.app.linkLabel} label="Existing project link label" />
            <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </article>
  );
}

function BlockView({ block, sectionIndex, blockIndex, background }: { block: BuilderBlock; sectionIndex: number; blockIndex: number; background: BuilderBackground }) {
  const base = `layout.sections.${sectionIndex}.blocks.${blockIndex}`;
  const path = (key: string) => `${base}.${key}`;
  const panelText = background === "panel" ? "text-panel-text" : "text-ink";
  const quietText = background === "panel" ? "text-panel-text-2" : "text-ink-soft";

  switch (block.type) {
    case "heading":
      return <EText path={path("text")} as="h3" className={cn("block font-display text-page font-normal", panelText)} label={`Section heading ${blockIndex + 1}`} />;
    case "text":
      return <EText path={path("text")} as="p" multiline className={cn("block max-w-[66ch] text-lg leading-relaxed", quietText)} label={`Section paragraph ${blockIndex + 1}`} />;
    case "quote":
      return (
        <blockquote className={cn("border-l-2 border-vermilion pl-5 sm:pl-7", blockIndex === 0 && "py-1")}>
          <EText path={path("text")} as="p" multiline className={cn("block max-w-[38ch] font-display text-title italic leading-snug", panelText)} label={`Quote ${blockIndex + 1}`} />
          {block.label && <EText path={path("label")} as="cite" className={cn("mt-4 block font-mono text-xs not-italic", quietText)} label={`Quote credit ${blockIndex + 1}`} />}
        </blockquote>
      );
    case "button": {
      const href = safeHref(block.href);
      return (
        <div className="flex flex-col items-start gap-2">
          {href ? (
            <Button href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} variant={block.variant || "ink"} className="min-h-12 px-6">
              <EText path={path("label")} label={`Button ${blockIndex + 1} label`} />
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          ) : (
            <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-rule-strong px-5 font-mono text-xs text-graphite">
              <EText path={path("label")} label={`Button ${blockIndex + 1} label`} />
              <span>add a safe link in the builder</span>
            </span>
          )}
          {block.body && <EText path={path("body")} as="span" className={cn("text-sm", quietText)} label={`Button note ${blockIndex + 1}`} />}
        </div>
      );
    }
    case "image":
      return (
        <figure className="builder-image m-0">
          <EImage srcPath={path("src")} altPath={path("alt")}>
            {(src, alt) => safeImageSrc(src) ? (
              <img src={safeImageSrc(src)} alt={alt} loading="lazy" decoding="async" className="block h-auto max-h-[70vh] w-full rounded-[var(--radius-md)] object-cover" />
            ) : (
              <div className="grid min-h-48 place-items-center rounded-[var(--radius-md)] border border-dashed border-rule-strong font-mono text-xs text-graphite">Choose an image in edit mode</div>
            )}
          </EImage>
          {block.caption && <EText path={path("caption")} as="figcaption" className={cn("mt-3 block font-mono text-xs", quietText)} label={`Image caption ${blockIndex + 1}`} />}
        </figure>
      );
    case "card":
      return (
        <article className="builder-card h-full">
          {block.eyebrow && <EText path={path("eyebrow")} className="kicker block text-vermilion-ink" label={`Card label ${blockIndex + 1}`} />}
          <EText path={path("title")} as="h3" className={cn("mt-3 block font-display text-title", panelText)} label={`Card title ${blockIndex + 1}`} />
          <EText path={path("body")} as="p" multiline className={cn("mt-3 block leading-relaxed", quietText)} label={`Card copy ${blockIndex + 1}`} />
        </article>
      );
    case "callout":
      return (
        <aside className="builder-callout">
          <span aria-hidden className="builder-callout-mark">✳</span>
          <div className="min-w-0">
            {block.eyebrow && <EText path={path("eyebrow")} className="kicker block text-vermilion-ink" label={`Callout label ${blockIndex + 1}`} />}
            <EText path={path("title")} as="h3" className={cn("mt-1 block font-display text-title", panelText)} label={`Callout title ${blockIndex + 1}`} />
            <EText path={path("body")} as="p" multiline className={cn("mt-2 block leading-relaxed", quietText)} label={`Callout copy ${blockIndex + 1}`} />
          </div>
        </aside>
      );
    case "list":
      return (
        <div>
          {block.title && <EText path={path("title")} as="h3" className={cn("mb-3 block font-display text-title", panelText)} label={`List title ${blockIndex + 1}`} />}
          <ul className="builder-list scroll-stagger">
            {(block.items || []).map((_, itemIndex) => (
              <li key={itemIndex} className={cn("builder-list-item", quietText)}>
                <span aria-hidden className="builder-list-dot" />
                <EText path={`${path("items")}.${itemIndex}`} multiline className="min-w-0 flex-1" label={`List ${blockIndex + 1}, item ${itemIndex + 1}`} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "project":
      return <ProjectTile source={block.source === "app" ? "app" : "rom"} background={background} />;
    case "metric":
      return (
        <div className="builder-metric">
          <EText path={path("value")} as="p" className="block font-display text-display leading-none text-vermilion-ink tabular" label={`Metric value ${blockIndex + 1}`} />
          <EText path={path("label")} as="p" className={cn("mt-2 block font-mono text-xs uppercase tracking-[0.1em]", quietText)} label={`Metric label ${blockIndex + 1}`} />
        </div>
      );
    case "divider":
      return <div aria-hidden className="builder-divider"><span>✦</span></div>;
    case "spacer":
      return <div aria-hidden className={cn("builder-spacer", `builder-spacer--${block.size || "md"}`)} />;
    default:
      return null;
  }
}

const layoutClass: Record<BuilderLayout, string> = {
  editorial: "builder-blocks--editorial",
  split: "builder-blocks--split",
  cards: "builder-blocks--cards",
  banner: "builder-blocks--banner",
};

/** A fully owner-created section. All copy remains plain text and all media uses the shared image API. */
export function BuilderSection({ section, sectionIndex, scrollChapter }: { section: CustomPageSection; sectionIndex: number; scrollChapter?: string }) {
  const { editing } = useContent();
  const rootId = `site-${section.id.replace(/[^a-z0-9_-]/gi, "-")}`;
  const background = section.background || "paper";
  const motion = section.motion || "reveal";
  const blocks = Array.isArray(section.blocks) ? section.blocks : [];
  const content = (
    <section
      id={rootId}
      aria-label={section.title || section.label || "Custom section"}
      data-scroll-chapter={scrollChapter}
      data-texture={section.texture || "none"}
      className={cn("builder-section relative overflow-clip", `builder-section--${background}`)}
    >
      <div className="page relative z-[1] py-20 lg:py-28">
        <header className={cn("builder-section-heading", section.layout === "banner" && "builder-section-heading--banner")}>
          {(editing || section.label) && <Kicker className={background === "panel" ? "text-panel-text-2" : "text-ink-soft"}><EText path={`layout.sections.${sectionIndex}.label`} label="New section kicker" /></Kicker>}
          <EText path={`layout.sections.${sectionIndex}.title`} as="h2" className={cn("mt-4 block max-w-[18ch] font-display text-display font-normal", background === "panel" ? "text-panel-text" : "text-ink")} label="New section heading" />
          {(editing || section.description) && <EText path={`layout.sections.${sectionIndex}.description`} as="p" multiline className={cn("mt-5 block max-w-[60ch] text-lede", background === "panel" ? "text-panel-text-2" : "text-ink-soft")} label="New section introduction" />}
        </header>
        {!!blocks.length || editing ? (
          <div className={cn("builder-blocks mt-10", layoutClass[section.layout] || layoutClass.editorial, motion === "stagger" && "builder-blocks--stagger scroll-stagger")}>
            {blocks.map((block, blockIndex) => (
              <div className="builder-block" key={block.id || blockIndex}>
                <BlockView block={block} sectionIndex={sectionIndex} blockIndex={blockIndex} background={background} />
              </div>
            ))}
            {editing && !blocks.length && <p className="font-mono text-xs text-graphite">Add a block from the Page builder to start composing this section.</p>}
          </div>
        ) : null}
      </div>
    </section>
  );

  if (motion === "none") return content;
  if (motion === "stack") return <Reveal className="scroll-stack-card">{content}</Reveal>;
  if (motion === "drift") return <Reveal className="site-motion-drift">{content}</Reveal>;
  return <Reveal className={cn(motion === "stagger" && "site-motion-stagger")}>{content}</Reveal>;
}
