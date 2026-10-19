import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { GAMES, QUIZ, type Game } from "../lib/data";
import { CloseIcon } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

/* ================= Snake ================= */

const SNAKE_N = 15;
const SNAKE_CELL = 20;

function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("reze_snake_best") ?? 0));
  const [dead, setDead] = useState(false);
  const state = useRef({
    snake: [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 11, y: 7 },
    over: false,
  });

  const placeFood = useCallback(() => {
    const s = state.current;
    do {
      s.food = { x: Math.floor(Math.random() * SNAKE_N), y: Math.floor(Math.random() * SNAKE_N) };
    } while (s.snake.some((c) => c.x === s.food.x && c.y === s.food.y));
  }, []);

  const reset = () => {
    state.current = {
      snake: [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }],
      dir: { x: 1, y: 0 },
      next: { x: 1, y: 0 },
      food: { x: 11, y: 7 },
      over: false,
    };
    setScore(0);
    setDead(false);
  };

  const turn = useCallback((dx: number, dy: number) => {
    const s = state.current;
    if (s.dir.x === -dx && s.dir.y === -dy) return;
    s.next = { x: dx, y: dy };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) e.preventDefault();
      if (k === "arrowup" || k === "w") turn(0, -1);
      if (k === "arrowdown" || k === "s") turn(0, 1);
      if (k === "arrowleft" || k === "a") turn(-1, 0);
      if (k === "arrowright" || k === "d") turn(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const s = state.current;
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = "#1d1a18";
      ctx.lineWidth = 1;
      for (let i = 1; i < SNAKE_N; i++) {
        ctx.beginPath();
        ctx.moveTo(i * SNAKE_CELL + 0.5, 0);
        ctx.lineTo(i * SNAKE_CELL + 0.5, cv.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * SNAKE_CELL + 0.5);
        ctx.lineTo(cv.width, i * SNAKE_CELL + 0.5);
        ctx.stroke();
      }
      ctx.fillStyle = "#ee6018";
      ctx.fillRect(s.food.x * SNAKE_CELL + 5, s.food.y * SNAKE_CELL + 5, SNAKE_CELL - 10, SNAKE_CELL - 10);
      s.snake.forEach((c, i) => {
        ctx.fillStyle = i === 0 ? "#fafafa" : "#eeeeee";
        ctx.fillRect(c.x * SNAKE_CELL + 2, c.y * SNAKE_CELL + 2, SNAKE_CELL - 4, SNAKE_CELL - 4);
      });
    };

    const iv = setInterval(() => {
      const s = state.current;
      if (s.over) return;
      s.dir = s.next;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= SNAKE_N || head.y >= SNAKE_N || s.snake.some((c) => c.x === head.x && c.y === head.y)) {
        s.over = true;
        setDead(true);
        setBest((b) => {
          const nb = Math.max(b, s.snake.length - 3);
          localStorage.setItem("reze_snake_best", String(nb));
          return nb;
        });
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        setScore(s.snake.length - 3);
        placeFood();
      } else {
        s.snake.pop();
      }
      draw();
    }, 110);

    draw();
    return () => clearInterval(iv);
  }, [placeFood]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between pb-4">
        <MonoTag className="text-pale-stone tabular">Score {String(score).padStart(2, "0")}</MonoTag>
        <MonoTag className="text-graphite-mid tabular">Best {String(best).padStart(2, "0")}</MonoTag>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={SNAKE_N * SNAKE_CELL} height={SNAKE_N * SNAKE_CELL} className="border border-carbon-lift" />
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-obsidian-canvas/85">
            <MonoTag className="text-signal-orange">Signal lost — self-sabotage confirmed</MonoTag>
            <button onClick={reset} className="rounded-sm bg-chalk px-4 py-2 text-body-sm text-obsidian-canvas transition-colors duration-150 hover:bg-bone">
              Restart
            </button>
          </div>
        )}
      </div>
      {/* D-pad for touch */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:hidden">
        <span />
        <button aria-label="Up" onClick={() => turn(0, -1)} className="border border-carbon-lift px-4 py-2 font-geist-mono text-caption text-bone">▲</button>
        <span />
        <button aria-label="Left" onClick={() => turn(-1, 0)} className="border border-carbon-lift px-4 py-2 font-geist-mono text-caption text-bone">◀</button>
        <button aria-label="Down" onClick={() => turn(0, 1)} className="border border-carbon-lift px-4 py-2 font-geist-mono text-caption text-bone">▼</button>
        <button aria-label="Right" onClick={() => turn(1, 0)} className="border border-carbon-lift px-4 py-2 font-geist-mono text-caption text-bone">▶</button>
      </div>
      <MonoTag className="mt-4 hidden text-graphite-mid sm:block">Arrows / WASD to steer</MonoTag>
    </div>
  );
}

/* ================= Ping Pong ================= */

function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ you: 0, ai: 0 });
  const [winner, setWinner] = useState<null | "you" | "ai">(null);
  const s = useRef({ py: 80, ay: 80, bx: 150, by: 110, vx: 3.2, vy: 2.1, pyTarget: 80, you: 0, ai: 0, paused: false });

  const reset = (full: boolean) => {
    const st = s.current;
    st.bx = 150;
    st.by = 110;
    st.vx = (Math.random() > 0.5 ? 1 : -1) * 3.2;
    st.vy = (Math.random() - 0.5) * 4;
    if (full) {
      st.you = 0;
      st.ai = 0;
      st.paused = false;
      setScores({ you: 0, ai: 0 });
      setWinner(null);
    }
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      s.current.pyTarget = ((e.clientY - r.top) / r.height) * 220 - 30;
    };
    cv.addEventListener("pointermove", onMove);

    let raf = 0;
    const loop = () => {
      const st = s.current;
      if (!st.paused) {
        st.py += (st.pyTarget - st.py) * 0.25;
        st.py = Math.max(0, Math.min(160, st.py));
        st.ay += (st.by - 30 - st.ay) * 0.09;
        st.ay = Math.max(0, Math.min(160, st.ay));
        st.bx += st.vx;
        st.by += st.vy;
        if (st.by <= 4 || st.by >= 216) st.vy *= -1;
        if (st.bx <= 18 && st.bx >= 10 && st.by >= st.py && st.by <= st.py + 60) st.vx = Math.abs(st.vx) * 1.03;
        if (st.bx >= 282 && st.bx <= 290 && st.by >= st.ay && st.by <= st.ay + 60) st.vx = -Math.abs(st.vx) * 1.03;
        if (st.bx < -8) {
          st.ai += 1;
          setScores({ you: st.you, ai: st.ai });
          if (st.ai >= 5) { st.paused = true; setWinner("ai"); } else reset(false);
        }
        if (st.bx > 308) {
          st.you += 1;
          setScores({ you: st.you, ai: st.ai });
          if (st.you >= 5) { st.paused = true; setWinner("you"); } else reset(false);
        }
      }

      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, 300, 220);
      ctx.strokeStyle = "#1d1a18";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(150.5, 0);
      ctx.lineTo(150.5, 220);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(10, st.py, 5, 60);
      ctx.fillRect(285, st.ay, 5, 60);
      ctx.fillStyle = "#ee6018";
      ctx.fillRect(st.bx - 3, st.by - 3, 6, 6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between pb-4">
        <MonoTag className="text-pale-stone tabular">You {scores.you}</MonoTag>
        <MonoTag className="text-graphite-mid">First to 5</MonoTag>
        <MonoTag className="text-signal-orange tabular">AI {scores.ai}</MonoTag>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={300} height={220} className="cursor-none border border-carbon-lift touch-none" />
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-obsidian-canvas/85">
            <MonoTag className={winner === "you" ? "text-metric-green" : "text-signal-orange"}>
              {winner === "you" ? "Match — you win" : "Match — the machine wins"}
            </MonoTag>
            <button onClick={() => reset(true)} className="rounded-sm bg-chalk px-4 py-2 text-body-sm text-obsidian-canvas transition-colors duration-150 hover:bg-bone">
              Rematch
            </button>
          </div>
        )}
      </div>
      <MonoTag className="mt-4 text-graphite-mid">Move pointer over the court to steer</MonoTag>
    </div>
  );
}

/* ================= Reaction ================= */

function ReactionGame() {
  const [phase, setPhase] = useState<"idle" | "armed" | "go" | "result">("idle");
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("reze_reaction_best") ?? 0));
  const timer = useRef<number>(0);
  const t0 = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const arm = () => {
    setPhase("armed");
    timer.current = window.setTimeout(() => {
      t0.current = performance.now();
      setPhase("go");
    }, 1400 + Math.random() * 2200);
  };

  const click = () => {
    if (phase === "idle" || phase === "result") return arm();
    if (phase === "armed") {
      clearTimeout(timer.current);
      setMs(-1);
      setPhase("result");
      return;
    }
    if (phase === "go") {
      const dt = Math.round(performance.now() - t0.current);
      setMs(dt);
      setBest((b) => {
        const nb = b === 0 ? dt : Math.min(b, dt);
        localStorage.setItem("reze_reaction_best", String(nb));
        return nb;
      });
      setPhase("result");
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={click}
        className={cn(
          "flex h-56 w-full flex-col items-center justify-center gap-3 border transition-colors duration-150",
          phase === "go" ? "border-metric-green bg-metric-green/15" : phase === "armed" ? "border-signal-orange bg-obsidian-canvas" : "border-carbon-lift bg-carbon-lift/30 hover:border-ash-stroke"
        )}
      >
        {phase === "idle" && <MonoTag className="text-pale-stone">Click to arm</MonoTag>}
        {phase === "armed" && <MonoTag className="animate-pulse-ring rounded-full px-2 py-1 text-signal-orange">Wait for green…</MonoTag>}
        {phase === "go" && <span className="font-geist text-heading-lg tracking-[-0.025em] text-metric-green">CLICK</span>}
        {phase === "result" && ms === -1 && (
          <>
            <MonoTag className="text-signal-orange">False start — too eager</MonoTag>
            <MonoTag className="text-graphite-mid">Click to re-arm</MonoTag>
          </>
        )}
        {phase === "result" && ms > 0 && (
          <>
            <span className="font-geist text-heading-lg tracking-[-0.025em] text-bone tabular">{ms} ms</span>
            <MonoTag className="text-graphite-mid">Click to run again</MonoTag>
          </>
        )}
      </button>
      <MonoTag className="mt-4 text-center text-graphite-mid tabular">
        Personal best: {best > 0 ? `${best} ms` : "—"}
      </MonoTag>
    </div>
  );
}

/* ================= Roast Quiz ================= */

function QuizGame() {
  const [step, setStep] = useState(0);
  const [roasts, setRoasts] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const r = QUIZ[step].roasts[i];
    setTimeout(() => {
      setRoasts((prev) => [...prev, r]);
      setPicked(null);
      setStep((s) => s + 1);
    }, 1100);
  };

  if (step >= QUIZ.length) {
    return (
      <div className="flex flex-col gap-4">
        <MonoTag className="text-metric-green">Diagnosis complete</MonoTag>
        <ul className="space-y-2 border-y border-carbon-lift py-4">
          {roasts.map((r, i) => (
            <li key={i} className="font-geist-mono text-caption tracking-[-0.02em] text-warm-granite">
              <span className="mr-2 text-signal-orange">▸</span>
              {r}
            </li>
          ))}
        </ul>
        <button
          onClick={() => { setStep(0); setRoasts([]); }}
          className="self-start rounded-sm bg-chalk px-4 py-2 text-body-sm text-obsidian-canvas transition-colors duration-150 hover:bg-bone"
        >
          Run it back
        </button>
      </div>
    );
  }

  const q = QUIZ[step];
  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <MonoTag className="text-graphite-mid tabular">Question {step + 1} / {QUIZ.length}</MonoTag>
        <MonoTag className="text-signal-orange">Roast mode</MonoTag>
      </div>
      <p className="font-geist text-[20px] tracking-[-0.02em] text-bone">{q.q}</p>
      <div className="mt-5 flex flex-col gap-2.5">
        {q.opts.map((opt, i) => (
          <button
            key={opt}
            onClick={() => pick(i)}
            className={cn(
              "border px-4 py-3 text-left text-body-sm transition-colors duration-150",
              picked === i ? "border-signal-orange bg-signal-orange/10 text-bone" : "border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && <MonoTag className="mt-4 block animate-log-in text-signal-orange">{q.roasts[picked]}</MonoTag>}
    </div>
  );
}

/* ================= Modal shell + grid ================= */

function GameShell({ game, onClose }: { game: Game; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian-canvas/80 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${game.name} game`}
    >
      <div
        className="w-full max-w-lg animate-frame-in rounded-lg border border-ash-stroke bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-carbon-lift bg-carbon-lift/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <StatusDot tone="orange" pulse />
            <MonoTag className="text-pale-stone">{game.name.toLowerCase().replace(/\s/g, "-")} — play.exe</MonoTag>
          </div>
          <button onClick={onClose} aria-label="Close game" className="text-warm-granite transition-colors duration-150 hover:text-chalk">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {game.id === "snake" && <SnakeGame />}
          {game.id === "pong" && <PongGame />}
          {game.id === "reaction" && <ReactionGame />}
          {game.id === "quiz" && <QuizGame />}
        </div>
        <div className="border-t border-carbon-lift px-5 py-3">
          <MonoTag className="text-graphite-mid">ESC to eject · scores persist locally</MonoTag>
        </div>
      </div>
    </div>
  );
}

export function Play() {
  const [active, setActive] = useState<Game | null>(null);

  return (
    <section id="play" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="05" title="Play" note="04 units online" />

      <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <h2 className="max-w-xl font-geist text-heading tracking-[-0.031em] text-bone">
            The playground<span className="text-signal-orange">.</span>
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-sm text-body-sm text-warm-granite">
            Four canvas games, modal shells, zero stakes. High scores persist locally.
          </p>
        </Reveal>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {GAMES.filter((g) => g.playable).map((game, i) => (
          <Reveal key={game.id} delay={i * 45} className="h-full">
            <button
              onClick={() => setActive(game)}
              className="lift group flex h-full w-full flex-col rounded-md border border-carbon-lift bg-carbon-lift/15 p-4 text-left backdrop-blur-sm hover:border-ash-stroke"
            >
              <div className="flex items-center justify-between">
                <span className="font-geist-mono text-[18px] leading-none text-pale-stone transition-colors duration-150 group-hover:text-signal-orange">{game.mark}</span>
                <StatusDot tone="green" />
              </div>
              <span className="mt-4 font-geist text-body-sm uppercase tracking-[0.02em] text-bone transition-colors duration-150 group-hover:text-chalk">{game.name}</span>
              <span className="mt-1 text-[13px] leading-snug text-warm-granite">{game.desc}</span>
              <MonoTag className="mt-3 border-t border-carbon-lift pt-3 text-metric-green">Insert coin</MonoTag>
            </button>
          </Reveal>
        ))}
      </div>

      {active && <GameShell game={active} onClose={() => setActive(null)} />}
    </section>
  );
}
