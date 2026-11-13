import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Work } from "./components/Work";
import { Now } from "./components/Now";
import { Ask } from "./components/Ask";
import { Links } from "./components/Links";
import { Footer } from "./components/Footer";
import { MusicProvider } from "./components/MusicPlayer";
import { KanaMarquee } from "./components/AnimeFx";
import { useEffect } from "react";
import { ContentProvider, useContent } from "./content/store";

/** Escape leaves edit mode (the sidebar handles its own Escape first). */
function EditEscape() {
  const { editing, setEditing } = useContent();
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement)?.isContentEditable) return;
      if (document.querySelector('#mobile-sheet[data-open="true"]')) return; // first Escape closes the sheet
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
    <div className="min-h-screen overflow-x-clip bg-paper text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Work />
        <KanaMarquee />
        <Now />
        <Ask />
        <Links />
      </main>
      <Footer />
    </div>
    <EditEscape />
    </MusicProvider>
    </ContentProvider>
  );
}
