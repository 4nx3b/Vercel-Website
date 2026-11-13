import { useEffect, type ComponentType } from "react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Work } from "./components/Work";
import { Now } from "./components/Now";
import { Ask } from "./components/Ask";
import { Links } from "./components/Links";
import { Footer } from "./components/Footer";
import { MusicProvider } from "./components/MusicPlayer";
import { KanaMarquee } from "./components/AnimeFx";
import { Reveal } from "./components/Reveal";
import { ScrollIndex, type ScrollChapter } from "./components/ScrollIndex";
import { ContentProvider, useContent, type BuiltinSectionId, type PageSection } from "./content/store";
import { BuilderSection } from "./content/BuilderSection";

const BUILTIN_RENDERERS: Record<BuiltinSectionId, ComponentType> = {
  hero: Hero,
  work: Work,
  ticker: KanaMarquee,
  about: Now,
  ask: Ask,
  links: Links,
};

function SitePage() {
  const { content, editing } = useContent();
  const sections = Array.isArray(content.layout?.sections) ? content.layout.sections : [];
  const motion = content.design?.motionPreset || "balanced";
  const font = content.design?.fontPreset || "editorial";
  const anchors: Record<BuiltinSectionId, string> = {
    hero: "top",
    work: "work",
    ticker: "ticker",
    about: "about",
    ask: "ask",
    links: "links",
  };
  const labels: Record<BuiltinSectionId, string> = {
    hero: content.brand.name || "Intro",
    work: content.work.sectionLabel || "Work",
    ticker: "Interlude",
    about: content.about.sectionLabel || "About",
    ask: content.ask.sectionLabel || "Ask",
    links: content.links.sectionLabel || "Links",
  };
  const chapters: ScrollChapter[] = sections.flatMap((section) => {
    if (!section || section.visible === false) return [];
    if (section.kind === "custom") {
      const id = `site-${section.id.replace(/[^a-z0-9_-]/gi, "-")}`;
      return [{ id: section.id, href: `#${id}`, label: section.navLabel.trim() || section.title || section.label || "Section", identity: `custom:${section.motion}` }];
    }
    return [{ id: section.id, href: `#${anchors[section.component]}`, label: labels[section.component], identity: `builtin:${section.component}:${section.motion}` }];
  });

  const renderSection = (section: PageSection, index: number) => {
    if (!section || section.visible === false) return null;
    if (section.kind === "custom") {
      return <BuilderSection key={section.id} section={section} sectionIndex={index} scrollChapter={section.id} />;
    }
    const Component = BUILTIN_RENDERERS[section.component];
    if (!Component) return null;
    const body = <Component />;
    if (section.motion === "none") return <div className="site-motion-none" data-scroll-chapter={section.id} key={section.id}>{body}</div>;
    if (section.motion === "stack") return <Reveal className="scroll-stack-card" scrollChapter={section.id} key={section.id}>{body}</Reveal>;
    if (section.motion === "drift") return <Reveal className="site-motion-drift" scrollChapter={section.id} key={section.id}>{body}</Reveal>;
    return <Reveal className={section.motion === "stagger" ? "site-motion-stagger" : undefined} scrollChapter={section.id} key={section.id}>{body}</Reveal>;
  };

  return (
    <div data-font-preset={font} data-motion-preset={motion} className="min-h-screen overflow-x-clip bg-paper text-ink">
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <ScrollIndex chapters={chapters} />
      <main id="main" tabIndex={-1} className="outline-none">
        {sections.map(renderSection)}
      </main>
      {content.layout?.footerVisible !== false && <Footer />}
      {editing && <span className="sr-only" role="status">Private owner draft preview. Changes are not public until published.</span>}
    </div>
  );
}

/** Escape leaves edit mode (the sidebar handles its own Escape first). */
function EditEscape() {
  const { editing, setEditing } = useContent();
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement)?.isContentEditable) return;
      if (document.querySelector('[role="dialog"][aria-label="Page builder"]')) return;
      if (document.querySelector('#mobile-sheet[data-open="true"]')) return;
      setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.setAttribute("data-editing", "");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.removeAttribute("data-editing");
    };
  }, [editing, setEditing]);
  return null;
}

export default function App() {
  return (
    <ContentProvider>
      <MusicProvider>
        <SitePage />
        <EditEscape />
      </MusicProvider>
    </ContentProvider>
  );
}
