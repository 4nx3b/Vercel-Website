import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { EText } from "./Editable";
import { useContent, useField } from "./store";

/* ------------------------------------------------------------------ *
 * EAnchor — an editable link or button.
 * Content at `path` is { label, href, newTab?, hidden? } (a bare string is
 * accepted too and treated as the label, so old published content still works).
 * Visitors get a plain <a>. In edit mode the label is edited inline and the
 * ↗ chip opens a small dialog for the URL, new-tab and visibility.
 * Only https:, http:, mailto:, tel: and #section URLs are accepted — never
 * javascript: — and invalid stored values fall back to a safe default.
 * ------------------------------------------------------------------ */

export type LinkValue = { label: string; href: string; newTab?: boolean; hidden?: boolean };

const SAFE_URL = /^(https?:\/\/[^\s<>"]+|mailto:[^\s<>"]+|tel:\+?[\d\s().-]+|#[\w-]*)$/i;

export function safeHref(href: string | undefined, fallback = "#main"): string {
  const h = String(href ?? "").trim();
  return SAFE_URL.test(h) ? h : fallback;
}
export const isSafeHref = (href: string) => SAFE_URL.test(String(href).trim());
const isExternal = (h: string) => /^https?:/i.test(h);
const SECTION_PICKS = ["#top", "#work", "#about", "#play", "#ask", "#links"];

/** Normalises a stored link (string or object) into a LinkValue. */
export function toLink(value: unknown, fallbackHref: string, fallbackLabel = ""): LinkValue {
  if (typeof value === "string") return { label: value, href: fallbackHref };
  if (value && typeof value === "object") {
    const v = value as Partial<LinkValue> & { url?: string };
    return { label: v.label ?? fallbackLabel, href: v.href ?? v.url ?? fallbackHref, newTab: v.newTab, hidden: v.hidden };
  }
  return { label: fallbackLabel, href: fallbackHref };
}

type Props = {
  path: string;
  className?: string;
  /** decorate the label (icons, arrows); receives the rendered label */
  children?: (label: ReactNode) => ReactNode;
  as?: ElementType;
  fallbackHref?: string;
  onNavigate?: () => void;
  ariaLabel?: string;
  allowHide?: boolean;
  /** url field name inside the stored object, for shapes like { name, url } */
  urlKey?: "href" | "url";
  labelKey?: "label" | "name";
  [key: string]: unknown;
};

/**
 * Split storage keeps already-published content working: the label stays a
 * plain string at `path` (as before), and the URL / new-tab / hidden live in a
 * sibling object at `${path}Link`. Object-shaped paths are supported too.
 */
export function EAnchor({
  path,
  className,
  children,
  as: Tag = "a",
  fallbackHref = "#main",
  onNavigate,
  ariaLabel,
  allowHide = true,
  urlKey = "href",
  labelKey = "label",
  ...rest
}: Props) {
  const { editing } = useContent();
  const [raw, setRaw] = useField<unknown>(path);
  const [meta, setMeta] = useField<Partial<LinkValue> | undefined>(`${path}Link`);
  const [open, setOpen] = useState(false);
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const v: LinkValue = obj
    ? { label: String(obj[labelKey] ?? ""), href: String(obj[urlKey] ?? fallbackHref), newTab: obj.newTab as boolean | undefined, hidden: obj.hidden as boolean | undefined }
    : { label: typeof raw === "string" ? raw : "", href: meta?.href || fallbackHref, newTab: meta?.newTab, hidden: meta?.hidden };

  if (v.hidden && !editing) return null;

  const href = safeHref(v.href, fallbackHref);
  const ext = isExternal(href);
  const newTab = v.newTab ?? ext;
  const labelNode = editing ? <EText path={obj ? `${path}.${labelKey}` : path} label={`Link label: ${v.label || path}`} /> : v.label;

  const save = (next: LinkValue) => {
    if (obj) setRaw({ ...obj, [labelKey]: next.label, [urlKey]: next.href, newTab: next.newTab, hidden: next.hidden });
    else {
      setRaw(next.label);
      setMeta({ href: next.href, newTab: next.newTab, hidden: next.hidden });
    }
    setOpen(false);
  };

  return (
    <>
      <Tag
        {...rest}
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
        aria-label={ariaLabel}
        data-editable-link={editing || undefined}
        className={cn(className, editing && "editable-link", v.hidden && editing && "opacity-40")}
        onClick={(event: React.MouseEvent) => {
          if (editing) {
            event.preventDefault();
            return;
          }
          onNavigate?.();
        }}
      >
        {children ? children(labelNode) : labelNode}
        {editing && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Edit link URL: ${v.label || path}`}
            className="edit-link-chip"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setOpen(true);
              }
            }}
          >
            ↗
          </span>
        )}
      </Tag>
      {open && <LinkDialog value={{ ...v, newTab }} allowHide={allowHide} onClose={() => setOpen(false)} onSave={save} />}
    </>
  );
}

function LinkDialog({ value, allowHide, onClose, onSave }: { value: LinkValue; allowHide: boolean; onClose: () => void; onSave: (v: LinkValue) => void }) {
  const [label, setLabel] = useState(value.label);
  const [href, setHref] = useState(value.href);
  const [newTab, setNewTab] = useState(!!value.newTab);
  const [hidden, setHidden] = useState(!!value.hidden);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(typeof document !== "undefined" ? document.activeElement : null);

  useEffect(() => {
    box.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && box.current) {
        const items = Array.from(box.current.querySelectorAll<HTMLElement>("input, button"));
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    const back = opener.current as HTMLElement | null;
    return () => {
      window.removeEventListener("keydown", onKey, true);
      back?.focus?.();
    };
  }, [onClose]);

  const save = () => {
    const h = href.trim();
    if (!isSafeHref(h)) return setErr("Use an https:// link, mailto:, tel:, or a #section.");
    if (!label.trim()) return setErr("The label can't be empty.");
    onSave({ label: label.trim(), href: h, newTab, hidden });
  };

  return createPortal(
    <div className="edit-dialog-scrim" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label="Edit link" className="edit-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="kicker text-ink-soft">Edit link</p>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ea-label">Label</label>
        <input id="ea-label" className="edit-input" value={label} onChange={(e) => setLabel(e.target.value)} />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ea-href">URL</label>
        <input
          id="ea-href"
          className="edit-input"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://… or #section"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Jump to a section">
          {SECTION_PICKS.map((s) => (
            <button key={s} type="button" className="edit-pick" aria-pressed={href === s} onClick={() => setHref(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-ink">
          <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} className="h-5 w-5" /> Open in a new tab
        </label>
        {allowHide && (
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="h-5 w-5" /> Hide this link
          </label>
        )}
        {err && (
          <p role="alert" className="mt-2 font-mono text-xs text-vermilion-ink">
            {err}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="edit-btn">
            Cancel
          </button>
          <button type="button" onClick={save} className="edit-btn edit-btn-primary">
            Save link
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
