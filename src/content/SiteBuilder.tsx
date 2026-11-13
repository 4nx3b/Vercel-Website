import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown, ArrowUp, Copy, Eye, EyeOff, Layers, LayoutGrid, Minus, Plus,
  Quote, Sparkles, Trash2, Type, X,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  useContent,
  useField,
  type BuilderBackground,
  type BuilderBlock,
  type BuilderBlockType,
  type BuilderLayout,
  type BuilderTexture,
  type BuiltinSectionId,
  type CustomPageSection,
  type PageSection,
  type SectionMotion,
} from "./store";
import { uploadSiteImage } from "./Editable";

const BUILTINS: { id: BuiltinSectionId; label: string; description: string; motion: SectionMotion }[] = [
  { id: "hero", label: "Hero", description: "The opening statement and key visual", motion: "reveal" },
  { id: "work", label: "Work", description: "ROM release and shipped app", motion: "reveal" },
  { id: "ticker", label: "Signal ticker", description: "The Japanese character marquee", motion: "none" },
  { id: "about", label: "About", description: "Profile, interests, music and games", motion: "reveal" },
  { id: "ask", label: "Ask", description: "Question form and answered questions", motion: "reveal" },
  { id: "links", label: "Elsewhere", description: "Social links and contact channels", motion: "reveal" },
];

const BLOCK_OPTIONS: { type: BuilderBlockType; label: string; note: string; icon: typeof Type }[] = [
  { type: "heading", label: "Heading", note: "A display-serif subheading", icon: Type },
  { type: "text", label: "Paragraph", note: "Comfortable body copy", icon: Type },
  { type: "quote", label: "Pull quote", note: "An editorial quote with a vermilion rule", icon: Quote },
  { type: "button", label: "Link button", note: "A clear, styled call to action", icon: ArrowUp },
  { type: "image", label: "Image", note: "Responsive image with alt text", icon: LayoutGrid },
  { type: "card", label: "Card", note: "Eyebrow, title and supporting copy", icon: Layers },
  { type: "callout", label: "Callout", note: "A warm field-note highlight", icon: Sparkles },
  { type: "list", label: "List", note: "Reorderable points or features", icon: LayoutGrid },
  { type: "metric", label: "Metric", note: "A large number with a caption", icon: Sparkles },
  { type: "project", label: "Project tile", note: "Reuse the existing ROM or app card", icon: Layers },
  { type: "divider", label: "Divider", note: "A quiet ornamental pause", icon: Minus },
  { type: "spacer", label: "Breathing room", note: "A deliberate rhythm break", icon: Minus },
];

const FONT_OPTIONS = [
  { value: "editorial", label: "01 · Editorial", detail: "Instrument Serif + Geist + Geist Mono" },
  { value: "bookish", label: "02 · Bookish", detail: "Georgia + Trebuchet + Courier" },
  { value: "grotesk", label: "03 · Grotesk", detail: "Helvetica + Arial + system mono" },
  { value: "typewriter", label: "04 · Typewriter", detail: "Iowan serif + system sans + Courier" },
];
const MOTION_OPTIONS = [
  { value: "quiet", label: "Quiet", detail: "Short, soft entrances" },
  { value: "balanced", label: "Editorial", detail: "The original site rhythm" },
  { value: "expressive", label: "Expressive", detail: "Longer reveals and wider staggers" },
];
const SECTION_MOTIONS: { value: SectionMotion; label: string; detail: string }[] = [
  { value: "reveal", label: "Rise reveal", detail: "One measured entrance on scroll" },
  { value: "stagger", label: "Stagger", detail: "Blocks arrive in a short sequence" },
  { value: "stack", label: "Scroll stack", detail: "A card-like scroll pass" },
  { value: "drift", label: "Drift", detail: "A restrained scroll-linked drift" },
  { value: "none", label: "Still", detail: "No entrance motion" },
];
const LAYOUT_OPTIONS: { value: BuilderLayout; label: string }[] = [
  { value: "editorial", label: "Editorial column" },
  { value: "split", label: "Two columns" },
  { value: "cards", label: "Card grid" },
  { value: "banner", label: "Statement band" },
];
const BACKGROUND_OPTIONS: { value: BuilderBackground; label: string }[] = [
  { value: "paper", label: "Drafting paper" },
  { value: "sunk", label: "Sunk paper" },
  { value: "panel", label: "Ink panel" },
  { value: "accent", label: "Vermilion wash" },
];
const TEXTURE_OPTIONS: { value: BuilderTexture; label: string }[] = [
  { value: "none", label: "No texture" },
  { value: "grid", label: "Draft grid" },
  { value: "dots", label: "Halftone dots" },
  { value: "hatch", label: "Diagonal hatch" },
];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "new-section";
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function makeBlock(type: BuilderBlockType): BuilderBlock {
  const id = uid(type);
  switch (type) {
    case "heading": return { id, type, text: "A new heading" };
    case "text": return { id, type, text: "Write a clear, useful note here. Keep it human and let the layout breathe." };
    case "quote": return { id, type, text: "A sentence worth leaving a little space around.", label: "Your name / source" };
    case "button": return { id, type, label: "Explore the project", href: "#work", variant: "ink", body: "" };
    case "image": return { id, type, src: "", alt: "", caption: "" };
    case "card": return { id, type, eyebrow: "FIELD NOTE 01", title: "A small, focused idea", body: "Add the detail that makes this useful to someone reading." };
    case "callout": return { id, type, eyebrow: "NOTE", title: "A detail worth noticing", body: "Use this for a tip, caveat or short announcement." };
    case "list": return { id, type, title: "A few details", items: ["First point", "Second point"] };
    case "metric": return { id, type, value: "01", label: "A number with context" };
    case "project": return { id, type, source: "rom" };
    case "divider": return { id, type };
    case "spacer": return { id, type, size: "md" };
  }
}

type Template = "blank" | "field-note" | "quote-band" | "feature-grid";
function makeSection(template: Template, existing: PageSection[]): CustomPageSection {
  const titles: Record<Template, string> = {
    blank: "New section",
    "field-note": "Field notes",
    "quote-band": "A thought worth keeping",
    "feature-grid": "The details",
  };
  const baseSlug = slug(titles[template]);
  let id = baseSlug;
  let n = 2;
  while (existing.some((section) => section.id === id)) id = `${baseSlug}-${n++}`;
  const blocks: BuilderBlock[] = template === "field-note"
    ? [makeBlock("heading"), makeBlock("text"), makeBlock("list")]
    : template === "quote-band"
      ? [makeBlock("quote"), makeBlock("button")]
      : template === "feature-grid"
        ? [makeBlock("card"), makeBlock("card"), makeBlock("card")]
        : [];
  return {
    id,
    kind: "custom",
    visible: true,
    label: template === "blank" ? "NEW SECTION" : titleCase(template.replace(/-/g, " ")),
    title: titles[template],
    description: template === "blank" ? "" : "An original, editable section built from the site's field-note components.",
    showInNav: false,
    navLabel: "",
    layout: template === "quote-band" ? "banner" : template === "feature-grid" ? "cards" : "editorial",
    background: template === "quote-band" ? "sunk" : "paper",
    texture: "none",
    motion: template === "feature-grid" ? "stagger" : "reveal",
    blocks,
  };
}

function Field({ path, label, multiline = false, placeholder = "" }: { path: string; label: string; multiline?: boolean; placeholder?: string }) {
  const [value, setValue] = useField<string>(path);
  const [draft, setDraft] = useState(value ?? "");
  const input = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useEffect(() => {
    if (document.activeElement !== input.current) setDraft(value ?? "");
  }, [value]);
  const commit = () => {
    const next = draft.trim();
    if (next !== value) setValue(next);
  };
  return (
    <label className="builder-field">
      <span>{label}</span>
      {multiline ? (
        <textarea ref={input as React.RefObject<HTMLTextAreaElement>} rows={4} value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.currentTarget.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.currentTarget.blur(); } }} className="builder-control builder-control--textarea" />
      ) : (
        <input ref={input as React.RefObject<HTMLInputElement>} type="text" value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.currentTarget.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); event.currentTarget.blur(); } }} className="builder-control" />
      )}
    </label>
  );
}

function SelectField({ path, label, options }: { path: string; label: string; options: { value: string; label: string }[] }) {
  const [value, setValue] = useField<string>(path);
  return (
    <label className="builder-field">
      <span>{label}</span>
      <select className="builder-control" value={value ?? options[0]?.value ?? ""} onChange={(event) => setValue(event.currentTarget.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ToggleField({ path, label, note }: { path: string; label: string; note?: string }) {
  const [value, setValue] = useField<boolean>(path);
  return (
    <label className="builder-toggle">
      <span className="min-w-0"><strong>{label}</strong>{note && <small>{note}</small>}</span>
      <input type="checkbox" checked={!!value} onChange={(event) => setValue(event.currentTarget.checked)} />
      <span aria-hidden className="builder-toggle-mark" />
    </label>
  );
}

function BuilderImageField({ path }: { path: string }) {
  const [value, setValue] = useField<string>(path);
  const [draft, setDraft] = useState(value || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(value || ""); }, [value]);
  const commit = () => {
    const next = draft.trim();
    if (!next) { setValue(""); setError(""); return; }
    if (/^https:\/\//i.test(next) || /^fs:siteImages\/[\w-]{4,80}$/.test(next)) {
      setValue(next);
      setError("");
      return;
    }
    setError("Use an https:// image URL, or upload an image below.");
  };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const src = await uploadSiteImage(file);
      setValue(src);
      setDraft(src);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <div className="builder-field">
      <span>Image source</span>
      <input className="builder-control" type="text" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} onBlur={commit} placeholder="https://… or upload below" aria-label="Image source URL" />
      <div className="builder-upload-row">
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(event) => void upload(event.currentTarget.files?.[0])} aria-label="Choose an image file" />
        <button type="button" className="builder-upload-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Plus aria-hidden size={15} />{busy ? "Compressing and uploading…" : value?.startsWith("fs:siteImages/") ? "Replace uploaded image" : "Upload image"}
        </button>
        <small>WebP · max 1600px · up to 700 KB</small>
      </div>
      {error && <p role="alert" className="builder-error">{error}</p>}
    </div>
  );
}

function ItemsField({ path, label }: { path: string; label: string }) {
  const [items, setItems] = useField<string[]>(path);
  const list = Array.isArray(items) ? items : [];
  const update = (index: number, value: string) => setItems(list.map((item, i) => i === index ? value : item));
  return (
    <div className="builder-field">
      <span>{label}</span>
      <div className="builder-items">
        {list.map((item, index) => (
          <div className="builder-item-row" key={index}>
            <input className="builder-control" value={item} onChange={(event) => update(index, event.currentTarget.value)} aria-label={`${label} ${index + 1}`} />
            <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => setItems(list.filter((_, i) => i !== index))} aria-label={`Remove ${label} ${index + 1}`}><Trash2 aria-hidden size={16} /></button>
          </div>
        ))}
        <button type="button" className="builder-add-small" onClick={() => setItems([...list, "A new point"])}><Plus aria-hidden size={15} /> Add point</button>
      </div>
    </div>
  );
}

function BlockFields({ sectionIndex, blockIndex, block }: { sectionIndex: number; blockIndex: number; block: BuilderBlock }) {
  const root = `layout.sections.${sectionIndex}.blocks.${blockIndex}`;
  const field = (name: string, label: string, multiline = false, placeholder?: string) => <Field key={name} path={`${root}.${name}`} label={label} multiline={multiline} placeholder={placeholder} />;
  switch (block.type) {
    case "heading": return <>{field("text", "Heading", true)}</>;
    case "text": return <>{field("text", "Paragraph", true)}</>;
    case "quote": return <>{field("text", "Quote", true)}{field("label", "Credit / attribution")}</>;
    case "button": return <>{field("label", "Button label")}{field("href", "Link URL or #anchor")}<SelectField path={`${root}.variant`} label="Button treatment" options={[{ value: "ink", label: "Ink" }, { value: "accent", label: "Vermilion" }, { value: "outline", label: "Outline" }]} />{field("body", "Small note (optional)")}</>;
    case "image": return <><BuilderImageField path={`${root}.src`} />{field("alt", "Alt text")} {field("caption", "Caption (optional)")}</>;
    case "card": return <>{field("eyebrow", "Eyebrow")}{field("title", "Title")}{field("body", "Copy", true)}</>;
    case "callout": return <>{field("eyebrow", "Eyebrow")}{field("title", "Title")}{field("body", "Copy", true)}</>;
    case "list": return <>{field("title", "List heading")}<ItemsField path={`${root}.items`} label="List items" /></>;
    case "metric": return <>{field("value", "Value")} {field("label", "Caption")}</>;
    case "project": return <><SelectField path={`${root}.source`} label="Existing project" options={[{ value: "rom", label: "LunarisOS ROM" }, { value: "app", label: "ArchiveTune app" }]} /><p className="builder-help">This tile reuses the site's published project details, image and link; edit those fields in the original Work section.</p></>;
    case "spacer": return <SelectField path={`${root}.size`} label="Spacing" options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} />;
    case "divider": return <p className="builder-help">A quiet paper rule and small star; no extra copy needed.</p>;
  }
}

function BlockCard({ sectionIndex, blockIndex, block, total, onMove, onRemove }: { sectionIndex: number; blockIndex: number; block: BuilderBlock; total: number; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  const option = BLOCK_OPTIONS.find((entry) => entry.type === block.type);
  return (
    <details className="builder-block-card" open>
      <summary>
        <span className="builder-block-icon">{option ? <option.icon aria-hidden size={16} /> : <Layers aria-hidden size={16} />}</span>
        <span className="min-w-0 flex-1"><strong>{option?.label || block.type}</strong><small>{option?.note}</small></span>
        <span className="builder-block-actions" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="builder-icon-btn" disabled={blockIndex === 0} onClick={() => onMove(-1)} aria-label="Move block up"><ArrowUp aria-hidden size={15} /></button>
          <button type="button" className="builder-icon-btn" disabled={blockIndex === total - 1} onClick={() => onMove(1)} aria-label="Move block down"><ArrowDown aria-hidden size={15} /></button>
          <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={onRemove} aria-label="Remove block"><Trash2 aria-hidden size={15} /></button>
        </span>
      </summary>
      <div className="builder-block-fields"><BlockFields sectionIndex={sectionIndex} blockIndex={blockIndex} block={block} /></div>
    </details>
  );
}

function BlockPalette({ onAdd, disabled }: { onAdd: (type: BuilderBlockType) => void; disabled: boolean }) {
  return (
    <div className="builder-palette">
      {BLOCK_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button type="button" key={option.type} disabled={disabled} onClick={() => onAdd(option.type)} className="builder-palette-item">
            <span><Icon aria-hidden size={16} /></span>
            <strong>{option.label}</strong>
          </button>
        );
      })}
    </div>
  );
}

export function SiteBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dirty, status, publish, discard } = useContent();
  const [sectionsValue, setSections] = useField<PageSection[]>("layout.sections");
  const sections = Array.isArray(sectionsValue) ? sectionsValue : [];
  const [selectedId, setSelectedId] = useState<string>(sections[0]?.id || "");
  const selectedIndex = sections.findIndex((section) => section.id === selectedId);
  const selected = sections[selectedIndex];
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const missingBuiltins = useMemo(() => BUILTINS.filter((builtin) => !sections.some((section) => section.kind === "builtin" && section.component === builtin.id)), [sections]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]");
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!sections.some((section) => section.id === selectedId)) setSelectedId(sections[0]?.id || "");
  }, [sections, selectedId]);

  if (!open) return null;

  const updateSection = (index: number, transform: (section: PageSection) => PageSection) => {
    setSections(sections.map((section, i) => i === index ? transform(section) : section));
  };
  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setSections(next);
  };
  const addBuiltin = (component: BuiltinSectionId) => {
    const spec = BUILTINS.find((item) => item.id === component);
    if (!spec || sections.length >= 30) return;
    const next: PageSection = { id: component, kind: "builtin", component, visible: true, motion: spec.motion };
    setSections([...sections, next]);
    setSelectedId(next.id);
  };
  const addCustom = (template: Template) => {
    if (sections.length >= 30) return;
    const next = makeSection(template, sections);
    setSections([...sections, next]);
    setSelectedId(next.id);
  };
  const removeSection = (index: number) => {
    const target = sections[index];
    if (!target) return;
    if (target.kind === "builtin" && target.component === "ask") {
      window.alert("The Ask section contains the owner sign-in entry point, so it must stay on the page.");
      return;
    }
    setSections(sections.filter((_, i) => i !== index));
    if (target.id === selectedId) setSelectedId(sections[index + 1]?.id || sections[index - 1]?.id || "");
  };
  const toggleVisibility = (index: number) => {
    const target = sections[index];
    if (target?.kind === "builtin" && target.component === "ask" && target.visible) {
      window.alert("The Ask section contains the owner sign-in entry point, so it must stay visible.");
      return;
    }
    updateSection(index, (section) => ({ ...section, visible: !section.visible } as PageSection));
  };
  const duplicateSection = (index: number) => {
    const target = sections[index];
    if (!target || target.kind !== "custom" || sections.length >= 30) return;
    const copy = { ...target, id: `${target.id}-copy-${Date.now().toString(36)}`, title: `${target.title} · copy`, blocks: target.blocks.map((block) => ({ ...block, id: uid(block.type), items: block.items ? [...block.items] : undefined })) } satisfies CustomPageSection;
    setSections([...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)]);
    setSelectedId(copy.id);
  };
  const addBlock = (type: BuilderBlockType) => {
    if (selected?.kind !== "custom" || selected.blocks.length >= 60) return;
    updateSection(selectedIndex, (section) => section.kind === "custom" ? { ...section, blocks: [...section.blocks, makeBlock(type)] } : section);
  };
  const mutateBlock = (transform: (blocks: BuilderBlock[]) => BuilderBlock[]) => {
    updateSection(selectedIndex, (section) => section.kind === "custom" ? { ...section, blocks: transform(section.blocks) } : section);
  };
  const activeBuiltin = selected?.kind === "builtin" ? BUILTINS.find((item) => item.id === selected.component) : undefined;
  const isBusy = status.kind === "saving";

  return createPortal(
    <div ref={dialogRef} className="site-builder" role="dialog" aria-modal="true" aria-label="Page builder">
      <header className="site-builder-header">
        <div className="site-builder-brand">
          <span className="site-builder-mark"><Layers aria-hidden size={17} /></span>
          <div><p className="kicker">Site workshop · owner</p><h1>Page builder</h1></div>
        </div>
        <div className="site-builder-header-actions">
          <span className={cn("builder-save-state", dirty && "builder-save-state--dirty")} aria-live="polite">
            <i aria-hidden />{status.msg || (dirty ? "Unpublished changes" : "All changes published")}
          </span>
          <button type="button" disabled={!dirty || isBusy} onClick={discard} className="builder-header-btn">Discard draft</button>
          <button type="button" disabled={!dirty || isBusy} onClick={() => void publish()} className="builder-header-btn builder-header-btn--publish">
            {isBusy ? "Publishing…" : "Publish to everyone"}
          </button>
          <button type="button" className="builder-close" onClick={onClose} aria-label="Close page builder"><X aria-hidden size={19} /></button>
        </div>
      </header>

      <div className="site-builder-layout">
        <aside className="site-builder-rail">
          <section className="builder-settings-group">
            <div className="builder-group-heading"><span>01</span><h2>Design system</h2></div>
            <SelectField path="design.fontPreset" label="Type system" options={FONT_OPTIONS} />
            <SelectField path="design.motionPreset" label="Motion energy" options={MOTION_OPTIONS} />
            <p className="builder-help">Curated system fonts use the existing font stack and local fallbacks—no added font downloads.</p>
            <ToggleField path="layout.footerVisible" label="Show closing band and footer" note="Ask stays visible as the owner sign-in entry point." />
          </section>

          <section className="builder-settings-group builder-sections-group">
            <div className="builder-group-heading"><span>02</span><h2>Page order</h2></div>
            <p className="builder-help">Reorder with the arrows, hide a section, or remove it. Ask stays visible for owner sign-in.</p>
            <ol className="builder-section-list">
              {sections.map((section, index) => {
                const name = section.kind === "custom" ? section.title || "Untitled section" : BUILTINS.find((item) => item.id === section.component)?.label || section.component;
                const type = section.kind === "custom" ? "Custom section" : "Existing section";
                return (
                  <li className={cn("builder-section-row", selectedId === section.id && "builder-section-row--selected", !section.visible && "builder-section-row--hidden")} key={section.id}>
                    <button type="button" className="builder-section-pick" onClick={() => setSelectedId(section.id)} aria-current={selectedId === section.id ? "true" : undefined}>
                      <span className="builder-section-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="builder-section-name"><strong>{name}</strong><small>{type}</small></span>
                    </button>
                    <div className="builder-section-controls">
                      <button type="button" className="builder-icon-btn" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label={`Move ${name} up`}><ArrowUp aria-hidden size={14} /></button>
                      <button type="button" className="builder-icon-btn" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)} aria-label={`Move ${name} down`}><ArrowDown aria-hidden size={14} /></button>
                      <button type="button" className="builder-icon-btn" onClick={() => toggleVisibility(index)} aria-label={section.visible ? `Hide ${name}` : `Show ${name}`}>{section.visible ? <Eye aria-hidden size={14} /> : <EyeOff aria-hidden size={14} />}</button>
                      {section.kind === "custom" && <button type="button" className="builder-icon-btn" onClick={() => duplicateSection(index)} disabled={sections.length >= 30} aria-label={`Duplicate ${name}`}><Copy aria-hidden size={14} /></button>}
                      <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => removeSection(index)} aria-label={`Remove ${name}`}><Trash2 aria-hidden size={14} /></button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {missingBuiltins.length > 0 && (
              <label className="builder-field builder-existing-picker">
                <span>Restore an existing section</span>
                <select className="builder-control" value="" onChange={(event) => { if (event.currentTarget.value) addBuiltin(event.currentTarget.value as BuiltinSectionId); }}>
                  <option value="">Choose a site section…</option>
                  {missingBuiltins.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            )}
          </section>

          <section className="builder-settings-group">
            <div className="builder-group-heading"><span>03</span><h2>Start a new section</h2></div>
            <p className="builder-help">Each section is made from plain text, safe links and optimized media blocks.</p>
            <div className="builder-template-list">
              {([
                ["blank", "Blank canvas", "Compose from the element palette"],
                ["field-note", "Field note", "A heading, paragraph and list"],
                ["quote-band", "Quote band", "A bold thought with a link"],
                ["feature-grid", "Feature grid", "Three design-system cards"],
              ] as [Template, string, string][]).map(([template, title, note]) => (
                <button type="button" key={template} disabled={sections.length >= 30} className="builder-template" onClick={() => addCustom(template)}>
                  <span className="builder-template-plus"><Plus aria-hidden size={15} /></span><span><strong>{title}</strong><small>{note}</small></span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="site-builder-detail">
          {selected ? (
            <>
              <div className="builder-detail-topline"><span className="kicker">{selected.kind === "custom" ? "Custom section" : "Original site section"}</span><span className="builder-detail-id">#{selected.id}</span></div>
              {selected.kind === "custom" ? (
                <>
                  <div className="builder-detail-title"><h2>Section settings</h2><p>Build with the same paper, ink, vermilion and generous spacing used across the site.</p></div>
                  <div className="builder-field-grid">
                    <Field path={`layout.sections.${selectedIndex}.label`} label="Section label / kicker" placeholder="FIELD NOTE 01" />
                    <Field path={`layout.sections.${selectedIndex}.title`} label="Section heading" placeholder="A new idea" />
                    <Field path={`layout.sections.${selectedIndex}.description`} label="Introduction" multiline placeholder="One short paragraph to set up this section…" />
                    <SelectField path={`layout.sections.${selectedIndex}.layout`} label="Composition" options={LAYOUT_OPTIONS} />
                    <SelectField path={`layout.sections.${selectedIndex}.background`} label="Surface" options={BACKGROUND_OPTIONS} />
                    <SelectField path={`layout.sections.${selectedIndex}.texture`} label="Surface texture" options={TEXTURE_OPTIONS} />
                    <SelectField path={`layout.sections.${selectedIndex}.motion`} label="Scroll motion" options={SECTION_MOTIONS} />
                    <ToggleField path={`layout.sections.${selectedIndex}.showInNav`} label="Add to navigation" note="Adds a link in the site menu." />
                    {selected.showInNav && <Field path={`layout.sections.${selectedIndex}.navLabel`} label="Navigation label" placeholder={selected.title || "Section"} />}
                  </div>
                  <section className="builder-block-editor">
                    <div className="builder-detail-title builder-block-editor-head"><div><h2>Element palette</h2><p>Drop a piece into this section. Move it later with the arrows.</p></div><span>{selected.blocks.length}/60</span></div>
                    <BlockPalette disabled={selected.blocks.length >= 60} onAdd={addBlock} />
                    <div className="builder-block-stack">
                      {selected.blocks.map((block, blockIndex) => (
                        <BlockCard
                          key={block.id}
                          sectionIndex={selectedIndex}
                          blockIndex={blockIndex}
                          block={block}
                          total={selected.blocks.length}
                          onMove={(direction) => mutateBlock((blocks) => {
                            const next = [...blocks];
                            const nextIndex = blockIndex + direction;
                            if (nextIndex >= 0 && nextIndex < next.length) [next[blockIndex], next[nextIndex]] = [next[nextIndex], next[blockIndex]];
                            return next;
                          })}
                          onRemove={() => mutateBlock((blocks) => blocks.filter((_, i) => i !== blockIndex))}
                        />
                      ))}
                      {!selected.blocks.length && <div className="builder-empty"><LayoutGrid aria-hidden size={24} /><p>This section is a blank canvas.</p><span>Choose a component above to compose the page.</span></div>}
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <div className="builder-detail-title"><h2>{activeBuiltin?.label || "Existing section"}</h2><p>{activeBuiltin?.description || "An original part of the site."} Copy and media in this section can also be edited inline on the page.</p></div>
                  <div className="builder-field-grid builder-field-grid--narrow">
                    <SelectField path={`layout.sections.${selectedIndex}.motion`} label="Scroll motion" options={SECTION_MOTIONS} />
                    <ToggleField path={`layout.sections.${selectedIndex}.visible`} label="Show this section" note="Hidden sections stay in the builder so you can restore them." />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="builder-empty builder-empty--start"><Layers aria-hidden size={28} /><h2>No section selected</h2><p>Add a section from the left rail or restore one of the original site sections.</p></div>
          )}
          <p className="builder-preview-note"><Sparkles aria-hidden size={15} /> The page behind this panel previews your private draft. Visitors see it after Publish.</p>
        </main>
      </div>
    </div>,
    document.body
  );
}
