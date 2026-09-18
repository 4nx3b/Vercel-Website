import Nav from "./Nav";
import Hero from "./Hero";
import About from "./About";
import Skills from "./Skills";
import Work from "./Work";
import Process from "./Process";
import Proof from "./Proof";
import Culture from "./Culture";
import Playground from "./Playground";
import Footer from "./Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-ink-900 font-body text-snow antialiased">
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-lime focus:px-5 focus:py-3 focus:font-mono focus:text-[12px] focus:font-bold focus:uppercase focus:tracking-[0.14em] focus:text-ink-900"
      >
        Skip to content
      </a>

      <Nav />

      <main>
        <Hero />
        <About />
        <Skills />
        <Work />
        <Process />
        <Proof />
        <Culture />
        <Playground />
      </main>

      <Footer />

      <div className="noise-layer" aria-hidden />
    </div>
  );
}
