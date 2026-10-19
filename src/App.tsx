import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";
import { Process } from "./components/Process";
import { Proof } from "./components/Proof";
import { Now } from "./components/Now";
import { Play } from "./components/Play";
import { Ask } from "./components/Ask";
import { Links } from "./components/Links";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-obsidian-canvas text-bone">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Skills />
        <Work />
        <Process />
        <Proof />
        <Now />
        <Play />
        <Ask />
        <Links />
      </main>
      <Footer />
    </div>
  );
}
