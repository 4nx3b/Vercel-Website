import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { ToolStrip } from "./components/ToolStrip";
import { Skills } from "./components/Skills";
import { Process } from "./components/Process";
import { Work } from "./components/Work";
import { Now } from "./components/Now";
import { Principles } from "./components/Principles";
import { Ask } from "./components/Ask";
import { Links } from "./components/Links";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <ToolStrip />
        <Skills />
        <Process />
        <Work />
        <Now />
        <Principles />
        <Ask />
        <Links />
      </main>
      <Footer />
    </div>
  );
}
