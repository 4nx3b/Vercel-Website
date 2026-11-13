import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Type } from "lucide-react";
import { cn } from "../utils/cn";
import { FIREBASE } from "../lib/data";
import { jfetch, refreshTokenIfNeeded } from "../lib/owner";
import { getPath, useContent, useField, type Block, type SectionId } from "./store";

/* ------------------------------------------------------------------ *
 * Inline editing primitives. For visitors they render exactly what the
 * page rendered before (plain text / plain lists); the editing chrome only
 * appears while the signed-in owner has Edit mode on. Text is always
 * plain text (contentEditable="plaintext-only"), never HTML.
 * ------------------------------------------------------------------ */

/** Editable text. */
export function EText({ path, as: Tag = "span", className, label, multiline = false }: { path: string; as?: ElementType; className?: string; label?: string; multiline?: boolean }) {
  const { editing } = useContent();
  const [value, setValue] = useField<string>(path);
  const ref = useRef<HTMLElement>(null);

  // keep the DOM text in sync when not focused (e.g. after Discard)
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value ?? "";
  }, [value, editing]);

  if (!editing) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      ref={ref}
      role="textbox"
      aria-label={label ?? `Edit ${path}`}
      aria-multiline={multiline || undefined}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      className={cn(className, "editable")}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const t = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim();
        if (t !== value) setValue(t);
      }}
    >
      {value}
    </Tag>
  );
}

/** Editable list: items rendered by the caller; edit mode adds move / remove / add. */
export function EList<T>({
  path,
  newItem,
  children,
  as: Tag = "ul",
  className,
  itemLabel = "item",
}: {
  path: string;
  newItem: () => T;
  children: (item: T, i: number, path: string) => ReactNode;
  as?: ElementType;
  className?: string;
  itemLabel?: string;
}) {
  const { editing } = useContent();
  const [items, setItems] = useField<T[]>(path);
  const list = Array.isArray(items) ? items : [];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  return (
    <>
      <Tag className={className}>
        {list.map((it, i) =>
          editing ? (
            <EditableRow key={i} onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => setItems(list.filter((_, k) => k !== i))} first={i === 0} last={i === list.length - 1} label={`${itemLabel} ${i + 1}`}>
              {children(it, i, `${path}.${i}`)}
            </EditableRow>
          ) : (
            children(it, i, `${path}.${i}`)
          )
        )}
      </Tag>
      {editing && (
        <button type="button" onClick={() => setItems([...list, newItem()])} className="edit-add">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add {itemLabel}
        </button>
      )}
    </>
  );
}

function EditableRow({ children, onUp, onDown, onRemove, first, last, label }: { children: ReactNode; onUp: () => void; onDown: () => void; onRemove: () => void; first: boolean; last: boolean; label: string }) {
  return (
    <div className="edit-row">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="edit-tools" role="group" aria-label={`${label} controls`}>
        <button type="button" onClick={onUp} disabled={first} aria-label={`Move ${label} up`}>
          <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onDown} disabled={last} aria-label={`Move ${label} down`}>
          <ArrowDown aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- images ---------------- */

const MAX_W = 1600;
const MAX_BYTES = 700 * 1024;
const imgCache = new Map<string, string>();
const imgDoc = (id: string) => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteImages/${encodeURIComponent(id)}`;

/** Resolves `fs:siteImages/<id>` references to data URLs (cached); plain URLs pass through. */
export function useResolvedSrc(src: string | undefined) {
  const [out, setOut] = useState<string | undefined>(() => (src && src.startsWith("fs:") ? imgCache.get(src) : src));
  useEffect(() => {
    if (!src || !src.startsWith("fs:")) return setOut(src);
    if (imgCache.has(src)) return setOut(imgCache.get(src));
    let alive = true;
    jfetch(imgDoc(src.slice("fs:siteImages/".length)))
      .then((d) => {
        const data = d?.fields?.data?.stringValue;
        if (alive && typeof data === "string") {
          imgCache.set(src, data);
          setOut(data);
        }
      })
      .catch(() => alive && setOut(undefined));
    return () => {
      alive = false;
    };
  }, [src]);
  return out;
}

async function toWebp(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.82;
  let url = c.toDataURL("image/webp", q);
  while (url.length * 0.75 > MAX_BYTES && q > 0.4) {
    q -= 0.12;
    url = c.toDataURL("image/webp", q);
  }
  if (url.length * 0.75 > MAX_BYTES) throw new Error("Image is too large even after compression (max 700 KB).");
  return url;
}

async function uploadImage(dataUrl: string): Promise<string> {
  const id = (crypto.randomUUID ? crypto.randomUUID() : `img_${Date.now()}`).replace(/[^\w-]/g, "");
  const token = await refreshTokenIfNeeded();
  await jfetch(imgDoc(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ fields: { data: { stringValue: dataUrl }, createdAt: { stringValue: new Date().toISOString() } } }),
  });
  const ref = `fs:siteImages/${id}`;
  imgCache.set(ref, dataUrl);
  return ref;
}

/** Wraps an image; in edit mode adds a "Replace image" button that opens a small dialog. */
export function EImage({ srcPath, altPath, children }: { srcPath: string; altPath: string; children: (src: string, alt: string) => ReactNode }) {
  const { editing, content, set } = useContent();
  const rawSrc = getPath(content, srcPath) as string;
  const alt = getPath(content, altPath) as string;
  const src = useResolvedSrc(rawSrc) ?? rawSrc;
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {children(src, alt)}
      {editing && (
        <>
          <button type="button" onClick={() => setOpen(true)} className="edit-img-btn">
            <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Replace image
          </button>
          {open && (
            <ImageDialog
              initialAlt={alt}
              onClose={() => setOpen(false)}
              onSave={(newSrc, newAlt) => {
                set(srcPath, newSrc);
                set(altPath, newAlt);
                setOpen(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function ImageDialog({ initialAlt, onClose, onSave }: { initialAlt: string; onClose: () => void; onSave: (src: string, alt: string) => void }) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(initialAlt);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const save = async () => {
    setErr("");
    if (!alt.trim()) return setErr("Alt text is required.");
    if (!file && !/^https:\/\//.test(url.trim())) return setErr("Pick a file or paste an https:// image URL.");
    setBusy(true);
    try {
      const src = file ? await uploadImage(await toWebp(file)) : url.trim();
      onSave(src, alt.trim());
    } catch (e) {
      const m = (e as Error).message || "Upload failed";
      setErr(/permission|403/i.test(m) ? "Permission denied: deploy firestore.rules first." : m);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="edit-dialog-scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Replace image" className="edit-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="kicker text-ink-soft">Replace image</p>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-file">Upload (resized to 1600px, webp)</label>
        <input ref={first} id="ei-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-ink-soft" />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-url">…or image URL</label>
        <input id="ei-url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!!file} className="edit-input" />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-alt">Alt text (required)</label>
        <input id="ei-alt" type="text" value={alt} onChange={(e) => setAlt(e.target.value)} className="edit-input" />
        {err && <p role="alert" className="mt-3 font-mono text-xs text-vermilion-ink">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="edit-btn">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="edit-btn edit-btn-primary">{busy ? "Saving…" : "Use image"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- custom blocks ---------------- */

/** Owner-added text / image blocks at the end of a section. Renders nothing when empty. */
export function Blocks({ section, className }: { section: SectionId; className?: string }) {
  const { editing } = useContent();
  const [blocks, setBlocks] = useField<Block[]>(`blocks.${section}`);
  const list = Array.isArray(blocks) ? blocks : [];
  if (!list.length && !editing) return null;
  const add = (type: Block["type"]) =>
    setBlocks([...list, type === "text" ? { id: `b${Date.now()}`, type, text: "New text block" } : { id: `b${Date.now()}`, type, src: "", alt: "" }]);
  return (
    <div className={cn("mt-10 flex flex-col gap-6", className)}>
      {list.map((b, i) => {
        const body =
          b.type === "text" ? (
            <EText path={`blocks.${section}.${i}.text`} as="p" multiline className="max-w-[64ch] text-lg text-[var(--text-2)]" label={`Text block ${i + 1}`} />
          ) : (
            <EImage srcPath={`blocks.${section}.${i}.src`} altPath={`blocks.${section}.${i}.alt`}>
              {(src, alt) =>
                src ? (
                  <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto max-w-full rounded-[var(--radius-md)]" />
                ) : (
                  <div className="grid h-40 place-items-center rounded-[var(--radius-md)] border border-dashed border-rule-strong font-mono text-xs text-graphite">empty image block</div>
                )
              }
            </EImage>
          );
        return editing ? (
          <EditableRow
            key={b.id}
            label={`block ${i + 1}`}
            first={i === 0}
            last={i === list.length - 1}
            onUp={() => i > 0 && setBlocks(list.map((x, k) => (k === i - 1 ? list[i] : k === i ? list[i - 1] : x)))}
            onDown={() => i < list.length - 1 && setBlocks(list.map((x, k) => (k === i + 1 ? list[i] : k === i ? list[i + 1] : x)))}
            onRemove={() => setBlocks(list.filter((_, k) => k !== i))}
          >
            {body}
          </EditableRow>
        ) : (
          <div key={b.id}>{body}</div>
        );
      })}
      {editing && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => add("text")} className="edit-add">
            <Type aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add text
          </button>
          <button type="button" onClick={() => add("image")} className="edit-add">
            <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add image
          </button>
        </div>
      )}
    </div>
  );
}
