import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";
import { Now } from "./components/Now";
import { Play } from "./components/Play";
import { Ask } from "./components/Ask";
import { Links } from "./components/Links";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-obsidian-canvas text-bone">
      {/* Ambient layer — two slow-drifting glows behind the void */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-signal-orange/[0.05] blur-[140px] animate-ambient" />
        <div className="absolute bottom-[-15%] left-[-12%] h-[520px] w-[520px] rounded-full bg-metric-green/[0.04] blur-[150px] animate-ambient-slow" />
      </div>

      <div className="relative z-10">
        <Nav />
        <main>
          <Hero />
          <Marquee />
          <About />
          <Skills />
          <Work />
          <Now />
          <Play />
          <Ask />
          <Links />
        </main>
        <Footer />
      </div>
    </div>
  );
}
