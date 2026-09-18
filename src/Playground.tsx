import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { GAMES, LIVE_SITE, QUIZ } from "./data";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

/* ── Snake ── */
function SnakeGame() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const n = 16, cell = 20;
    let snk = [{ x: 8, y: 8 }];
    let dir = { x: 0, y: 0 };
    let food = { x: 4, y: 5 };
    let started = false, alive = true, sc = 0;
    let timer: ReturnType<typeof setTimeout>;

    const draw = () => {
      ctx.fillStyle = "#0d121b";
      ctx.fillRect(0, 0, 320, 320);
      ctx.strokeStyle = "rgba(238,241,247,0.05)";
      for (let i = 1; i < n; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, 320); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(320, i * cell); ctx.stroke();
      }
      ctx.fillStyle = "#eef1f7";
      snk.forEach((p) => ctx.fillRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2));
      ctx.fillStyle = "#c8f04f";
      ctx.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4);
    };

    const tick = () => {
      if (!alive) return;
      const h = { x: snk[0].x + dir.x, y: snk[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= n || h.y >= n || snk.some((p) => p.x === h.x && p.y === h.y)) {
        alive = false;
        setDead(true);
        draw();
        return;
      }
      snk.unshift(h);
      if (h.x === food.x && h.y === food.y) {
        sc++;
        setScore(sc);
        do {
          food = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) };
        } while (snk.some((p) => p.x === food.x && p.y === food.y));
      } else snk.pop();
      draw();
      timer = setTimeout(tick, 140);
    };

    const set = (d: string) => {
      if (!alive) return;
      const nd = ({ up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } } as Record<string, { x: number; y: number }>)[d];
      if (!nd) return;
      if (started && nd.x === -dir.x && nd.y === -dir.y) return;
      dir = nd;
      if (!started) {
        started = true;
        tick();
      }
    };
    (cv as HTMLCanvasElement & { setDir?: (d: string) => void }).setDir = set;

    const key = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      if (map[e.key]) {
        e.preventDefault();
        set(map[e.key]);
      }
    };
    document.addEventListener("keydown", key);
    draw();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
    };
  }, [round]);

  const dpad = (d: string) => {
    const cv = cvRef.current as (HTMLCanvasElement & { setDir?: (d: string) => void }) | null;
    cv?.setDir?.(d);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={cvRef} width={320} height={320} className="w-full max-w-[320px] border border-line" />
      <div className="flex w-full items-center justify-between">
        <p className="font-mono text-[12px] text-lime">score {score}</p>
        {dead ? (
          <button type="button" onClick={() => { setDead(false); setScore(0); setRound((r) => r + 1); }} className="bg-lime px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-900 transition-colors hover:bg-lime-deep">
            retry
          </button>
        ) : (
          <p className="font-mono text-[11px] text-fog-dim">arrow keys / d-pad</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label="Direction controls">
        <span />
        <DpadBtn label="up" onClick={() => dpad("up")} />
        <span />
        <DpadBtn label="left" onClick={() => dpad("left")} />
        <DpadBtn label="down" onClick={() => dpad("down")} />
        <DpadBtn label="right" onClick={() => dpad("right")} />
      </div>
    </div>
  );
}

function DpadBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const arrow = { up: "↑", down: "↓", left: "←", right: "→" }[label];
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-11 w-11 items-center justify-center border border-line bg-ink-800 font-mono text-lg text-snow transition-colors hover:border-lime/60 hover:text-lime active:bg-lime active:text-ink-900">
      {arrow}
    </button>
  );
}

/* ── Pong ── */
function PongGame() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ p: 0, a: 0 });
  const [over, setOver] = useState("");
  const [round, setRound] = useState(0);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let py = 90, ay = 90, bx = 180, by = 120, vx = 3, vy = 2, ps = 0, as = 0;
    let raf = 0;

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      py = Math.min(180, Math.max(0, ((e.clientY - r.top) / r.height) * 240 - 30));
    };
    cv.addEventListener("pointermove", move);

    const reset = () => {
      setScores({ p: ps, a: as });
      bx = 180; by = 120; vx = (Math.random() > 0.5 ? 1 : -1) * 3; vy = (Math.random() - 0.5) * 4;
    };

    const loop = () => {
      bx += vx; by += vy;
      if (by < 7 || by > 233) vy *= -1;
      if (bx < 26 && by > py - 4 && by < py + 64) vx = Math.abs(vx);
      if (bx > 334 && by > ay - 4 && by < ay + 64) vx = -Math.abs(vx);
      ay += Math.sign(by - (ay + 30)) * Math.min(2.6, Math.abs(by - (ay + 30)) * 0.08 + 1);
      if (bx < -10) { as++; reset(); }
      if (bx > 370) { ps++; reset(); }
      if (ps >= 5 || as >= 5) {
        setOver(ps > as ? "You win." : "AI wins.");
        return;
      }
      ctx.fillStyle = "#0d121b";
      ctx.fillRect(0, 0, 360, 240);
      ctx.strokeStyle = "rgba(238,241,247,0.06)";
      ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(180, 0); ctx.lineTo(180, 240); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#eef1f7";
      ctx.fillRect(10, py, 8, 60);
      ctx.fillRect(342, ay, 8, 60);
      ctx.fillStyle = "#c8f04f";
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", move);
    };
  }, [round]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas ref={cvRef} width={360} height={240} className="w-full max-w-[420px] cursor-none border border-line" />
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-lime">{over}</p>
            <button type="button" onClick={() => { setOver(""); setScores({ p: 0, a: 0 }); setRound((r) => r + 1); }} className="bg-lime px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-900">
              rematch
            </button>
          </div>
        )}
      </div>
      <p className="font-mono text-[12px] text-fog">
        you <span className="text-lime">{scores.p}</span> · <span className="text-coral">{scores.a}</span> ai — first to 5
      </p>
    </div>
  );
}

/* ── Reaction ── */
function ReactionGame() {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "early" | "done">("idle");
  const [ms, setMs] = useState(0);
  const tRef = useRef<ReturnType<typeof setTimeout>>(null);
  const startRef = useRef(0);

  useEffect(() => () => clearTimeout(tRef.current!), []);

  const start = () => {
    setPhase("wait");
    tRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, 1200 + Math.random() * 2800);
  };

  const click = () => {
    if (phase === "wait") {
      clearTimeout(tRef.current!);
      setPhase("early");
    } else if (phase === "go") {
      setMs(Math.round(performance.now() - startRef.current));
      setPhase("done");
    } else {
      start();
    }
  };

  const style =
    phase === "go" ? "bg-lime text-ink-900" :
    phase === "wait" ? "bg-coral/80 text-snow" :
    "bg-ink-800 text-snow";

  return (
    <button
      type="button"
      onClick={click}
      className={cn("flex h-64 w-full max-w-[420px] flex-col items-center justify-center gap-3 border border-line font-display text-2xl font-bold transition-colors duration-200", style)}
    >
      {phase === "idle" && <>tap to start</>}
      {phase === "wait" && <>wait for green…</>}
      {phase === "go" && <>CLICK!</>}
      {phase === "early" && <><span>too soon</span><span className="font-mono text-[12px] uppercase tracking-[0.18em] text-fog">tap to retry</span></>}
      {phase === "done" && <>
        <span>{ms} ms</span>
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-700">{ms < 250 ? "rooted reflexes" : ms < 400 ? "human, barely" : "need more coffee"}</span>
        <span className="font-mono text-[11px] text-ink-800">tap to retry</span>
      </>}
    </button>
  );
}

/* ── Roast Quiz ── */
function QuizGame() {
  const [i, setI] = useState(0);
  const [roast, setRoast] = useState<string | null>(null);
  const q = QUIZ[i % QUIZ.length];

  const pick = (k: number) => {
    setRoast(q.roasts[k]);
    setTimeout(() => {
      setRoast(null);
      setI((x) => x + 1);
    }, 1600);
  };

  return (
    <div className="w-full max-w-[420px]">
      <p className="font-display text-xl font-bold uppercase tracking-tight text-snow">{q.q}</p>
      <div className="mt-5 grid gap-3">
        {q.opts.map((o, k) => (
          <button
            key={o}
            type="button"
            disabled={roast !== null}
            onClick={() => pick(k)}
            className="border border-line bg-ink-800 px-5 py-3.5 text-left text-sm text-snow transition-all duration-300 hover:border-lime/60 hover:text-lime disabled:opacity-50"
          >
            {o}
          </button>
        ))}
      </div>
      <p className={cn("mt-5 min-h-[1.5rem] font-mono text-[13px] text-lime transition-opacity", roast ? "pop-in opacity-100" : "opacity-0")}>
        {roast ?? "…"}
      </p>
    </div>
  );
}

/* ── Modal + section ── */
export default function Playground() {
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const launch = (id: string, playable: boolean, name: string) => {
    if (playable) setOpen(id);
    else setToast(`${name} ships on the live site`);
  };

  const game = GAMES.find((g) => g.id === open);

  return (
    <section id="play" className="relative border-t border-line py-24 md:py-32">
      {/* glow in a clip wrapper — invisible containment, same reason as music */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute bottom-10 right-10 h-[380px] w-[380px] rounded-full bg-skyy/[0.05] blur-[110px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="07"
          kicker="play · playground"
          title={
            <>
              Games. Roasts. Questionable <span className="text-lime">life choices.</span>
            </>
          }
          note="Modules I wrote for fun that refused to stay small. Four run right here — the rest live on the full site."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((g, i) => (
            <Reveal key={g.id} delay={i * 60}>
              <button
                type="button"
                onClick={() => launch(g.id, g.playable, g.name)}
                className="hover-sweep group relative flex h-full w-full flex-col border border-line bg-ink-850 p-6 text-left transition-all duration-400 hover:-translate-y-1 hover:border-lime/45"
              >
                <div className="relative flex items-center justify-between">
                  <span className="font-display text-3xl text-lime" aria-hidden>{g.icon}</span>
                  <span className={cn("px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em]", g.playable ? "bg-lime/10 text-lime" : "border border-line text-fog-dim")}>
                    {g.playable ? "playable" : "live site"}
                  </span>
                </div>
                <h3 className="relative mt-5 font-display text-lg font-bold uppercase tracking-tight text-snow transition-colors group-hover:text-lime">{g.name}</h3>
                <p className="relative mt-1.5 text-[13px] leading-relaxed text-fog">{g.desc}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim transition-colors group-hover:text-lime">
                  {g.playable ? "▶ launch module" : "open live site"}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </button>
            </Reveal>
          ))}

          <Reveal delay={GAMES.length * 60}>
            <a
              href={LIVE_SITE}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col justify-between border border-lime/40 bg-lime/[0.06] p-6 transition-all duration-400 hover:-translate-y-1 hover:bg-lime/10"
            >
              <div>
                <span className="font-display text-3xl text-lime" aria-hidden>∞</span>
                <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-tight text-lime">The full playground</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-fog">Every game, the AMA, theming and more — running on therealreze.vercel.app.</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lime">
                visit <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>

      {open && game && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={game.name}>
          <button type="button" aria-label="Close game" onClick={() => setOpen(null)} className="absolute inset-0 bg-ink-950/90 backdrop-blur-sm" />
          <div className="pop-in relative w-full max-w-lg border border-line bg-ink-900 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-3 font-display text-xl font-bold uppercase tracking-tight text-snow">
                <span className="text-lime" aria-hidden>{game.icon}</span> {game.name}
              </h3>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center border border-line text-fog transition-colors hover:border-lime/60 hover:text-lime">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center">
              {open === "snake" && <SnakeGame />}
              {open === "pong" && <PongGame />}
              {open === "reaction" && <ReactionGame />}
              {open === "quiz" && <QuizGame />}
            </div>
          </div>
        </div>
      )}

      <div
        aria-live="polite"
        className={cn(
          "fixed bottom-6 left-1/2 z-[96] -translate-x-1/2 transition-all duration-400",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <a href={LIVE_SITE} target="_blank" rel="noreferrer" className="flex items-center gap-3 border border-lime/50 bg-ink-850 px-5 py-3 font-mono text-[12px] text-snow shadow-xl">
          <span className="text-lime">▲</span> {toast} <ExternalLink className="h-3 w-3 text-lime" />
        </a>
      </div>
    </section>
  );
}
