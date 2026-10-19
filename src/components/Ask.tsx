import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "../utils/cn";
import { SEED_QUESTIONS, type SeedQuestion } from "../lib/data";
import { CheckIcon } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

const QS_KEY = "reze_ama_qs_v1";
const VOTES_KEY = "reze_ama_votes_v1";

type Q = SeedQuestion;

function loadQuestions(): Q[] {
  try {
    const raw = localStorage.getItem(QS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Q[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through to seeds */
  }
  return SEED_QUESTIONS;
}

function timeAgo(ts: number) {
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  if (days === 0) return "today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function Ask() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [voted, setVoted] = useState<string[]>([]);
  const [sort, setSort] = useState<"NEWEST" | "TOP">("TOP");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setQuestions(loadQuestions());
    try {
      setVoted(JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]") as string[]);
    } catch {
      setVoted([]);
    }
  }, []);

  useEffect(() => {
    if (questions.length > 0) localStorage.setItem(QS_KEY, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(VOTES_KEY, JSON.stringify(voted));
  }, [voted]);

  const sorted = useMemo(
    () => [...questions].sort((a, b) => (sort === "TOP" ? b.votes - a.votes : b.ts - a.ts)),
    [questions, sort]
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const q: Q = { id: `q-${Date.now()}`, text: t, author: "you", votes: 1, ts: Date.now() };
    setQuestions((prev) => [q, ...prev]);
    setVoted((prev) => [...prev, q.id]);
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

  const vote = (id: string) => {
    if (voted.includes(id)) return;
    setVoted((prev) => [...prev, id]);
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q)));
  };

  return (
    <section id="ask" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="08" title="Ask" note="AMA · persists in your browser" />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        {/* Transmit */}
        <div>
          <Reveal>
            <h2 className="font-geist text-heading-lg tracking-[-0.025em] text-bone">
              Ask me anything<span className="text-signal-orange">.</span>
            </h2>
            <p className="mt-5 max-w-md text-body text-warm-granite">
              Root, ROMs, anime, anything. Questions and votes persist in this browser — the Telegram
              wire to my pocket lives on the mainframe build.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
              <label htmlFor="ama-text" className="sr-only">Your question</label>
              <textarea
                id="ama-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                required
                maxLength={280}
                placeholder="Type the question… 280 chars, no mercy."
                className="w-full resize-none rounded-sm border border-carbon-lift bg-carbon-lift/30 p-4 text-body text-bone placeholder:text-graphite-mid transition-colors duration-150 focus:border-ash-stroke focus:outline-none"
              />
              <div className="flex items-center justify-between gap-4">
                <MonoTag className="text-graphite-mid tabular">{280 - text.length} left</MonoTag>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-sm bg-carbon-lift px-4 font-geist text-body-sm text-bone transition-colors duration-150 hover:bg-graphite-mid hover:text-chalk"
                >
                  {sent ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-metric-green" />
                      Transmitted
                    </>
                  ) : (
                    "Transmit"
                  )}
                </button>
              </div>
            </form>
          </Reveal>
        </div>

        {/* The wire */}
        <Reveal delay={120}>
          <div className="flex items-center justify-between border-t border-carbon-lift pt-5">
            <MonoTag className="text-pale-stone">The wire — {String(sorted.length).padStart(2, "0")} questions</MonoTag>
            <div className="flex gap-2">
              {(["TOP", "NEWEST"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    "rounded-sm px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150",
                    sort === s ? "bg-chalk text-obsidian-canvas" : "border border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-5">
            {sorted.map((q) => {
              const isVoted = voted.includes(q.id);
              return (
                <li key={q.id} className="flex gap-5 border-b border-carbon-lift py-5 transition-colors duration-150 hover:bg-carbon-lift/20">
                  <button
                    onClick={() => vote(q.id)}
                    aria-label={`Upvote: ${q.text}`}
                    className={cn(
                      "flex h-fit shrink-0 flex-col items-center gap-1 border px-3 py-2 transition-colors duration-150",
                      isVoted ? "border-signal-orange/60 text-signal-orange" : "border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                    )}
                  >
                    <span className="text-body-sm leading-none">▲</span>
                    <span className="font-geist-mono text-caption tabular">{q.votes}</span>
                  </button>
                  <div>
                    <p className="text-body text-bone">{q.text}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <MonoTag className="text-graphite-mid">{timeAgo(q.ts)} · {q.author}</MonoTag>
                      {q.seeded && (
                        <span className="flex items-center gap-1.5">
                          <StatusDot tone="green" className="h-1 w-1" />
                          <MonoTag className="text-graphite-mid">Seeded</MonoTag>
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
