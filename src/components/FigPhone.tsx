import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from "react";
import type { PartitionKey } from "../lib/data";
import { prefersReducedMotion } from "../hooks/useInView";
import { hasFinePointer } from "../hooks/usePointerVars";

/**
 * FIG. 1 — an original exploded isometric drawing: a phone with its partition
 * stack lifted off in slabs. 1px ink strokes, each path drawn with .m-draw.
 *
 * Layering per slab (outer → inner), so no transform fights another:
 *   .fig-parallax  depth parallax from --px/--py (CSS)
 *   .fig-flash     the Flash sequence (Web Animations, translate only)
 *   .slab          hover / pick lift (CSS)
 *   paths          .m-draw / .m-rise intro animations
 */

const XV = [0.866, 0.5] as const; // iso x axis
const YV = [-0.866, 0.5] as const; // iso y axis
const W = 110; // footprint width
const L = 150; // footprint length
const OX = 150; // top corner x

type Pt = [number, number];
const r = (n: number) => Math.round(n * 10) / 10;
const p = ([x, y]: Pt) => `${r(x)} ${r(y)}`;
const at = (oy: number, u: number, v: number): Pt => [OX + u * XV[0] + v * YV[0], oy + u * XV[1] + v * YV[1]];

function slab(oy: number, t: number) {
  const P0 = at(oy, 0, 0);
  const P1 = at(oy, W, 0);
  const P2 = at(oy, W, L);
  const P3 = at(oy, 0, L);
  return (
    `M${p(P0)}L${p(P1)}L${p(P2)}L${p(P3)}Z` +
    `M${p(P3)}v${t}L${r(P2[0])} ${r(P2[1] + t)}L${r(P1[0])} ${r(P1[1] + t)}V${r(P1[1])}` +
    `M${p(P2)}v${t}`
  );
}

function face(oy: number, u0: number, v0: number, u1: number, v1: number) {
  return `M${p(at(oy, u0, v0))}L${p(at(oy, u1, v0))}L${p(at(oy, u1, v1))}L${p(at(oy, u0, v1))}Z`;
}

function line(oy: number, u0: number, v0: number, u1: number, v1: number) {
  return `M${p(at(oy, u0, v0))}L${p(at(oy, u1, v1))}`;
}

const PHONE_Y = 228;
/** bottom → top, so higher slabs occlude */
const SLABS: { key: PartitionKey; label: string; oy: number; depth: number }[] = [
  { key: "userdata", label: "USERDATA", oy: 170, depth: 2 },
  { key: "vendor", label: "VENDOR", oy: 124, depth: 3 },
  { key: "system", label: "SYSTEM", oy: 78, depth: 4 },
  { key: "boot", label: "BOOT", oy: 32, depth: 5 },
];

const ROOT_DOT = at(32, W / 2, L / 2);

/* Flash timeline (ms) — mirrors --dur-flash-in / --dur-flash-out */
const FLASH_IN = 450;
const FLASH_PULSE = 200;
const FLASH_OUT = 650;
const FLASH_STAGGER = 40;
const EASE_IN = "cubic-bezier(.5,0,.75,0)";
const EASE_OUT = "cubic-bezier(.22,1,.36,1)";

export type FigPhoneHandle = { flash: () => Promise<void> };

const depthStyle = (depth: number) => ({ ["--depth" as string]: depth }) as CSSProperties;

export const FigPhone = forwardRef<
  FigPhoneHandle,
  { active: PartitionKey | null; onActive: (k: PartitionKey) => void }
>(function FigPhone({ active, onActive }, ref) {
  const flashEls = useRef<(SVGGElement | null)[]>([]);
  const pulseEl = useRef<SVGGElement | null>(null);
  const running = useRef<Animation[]>([]);

  // Cancel any in-flight sequence on unmount
  useEffect(() => () => running.current.forEach((a) => a.cancel()), []);

  useImperativeHandle(ref, () => ({
    async flash() {
      if (prefersReducedMotion()) return;
      running.current.forEach((a) => a.cancel());
      // top-down: BOOT first
      const order = [...SLABS.keys()].reverse();
      const drop = (i: number) => PHONE_Y - SLABS[i].oy - 8 - i * 7;
      const track = (a: Animation) => (running.current.push(a), a);
      try {
        const down = order.map((i, n) =>
          track(
            flashEls.current[i]!.animate([{ transform: "translateY(0)" }, { transform: `translateY(${drop(i)}px)` }], {
              duration: FLASH_IN,
              easing: EASE_IN,
              delay: n * FLASH_STAGGER,
              fill: "forwards",
            })
          )
        );
        await Promise.all(down.map((a) => a.finished));
        const pulse = pulseEl.current
          ? track(
              pulseEl.current.animate(
                [
                  { transform: "scale(1)", opacity: 1 },
                  { transform: "scale(1.9)", opacity: 0.35 },
                  { transform: "scale(1)", opacity: 1 },
                ],
                { duration: FLASH_PULSE, easing: "ease-out" }
              )
            )
          : null;
        await pulse?.finished;
        const up = order
          .slice()
          .reverse()
          .map((i, n) =>
            track(
              flashEls.current[i]!.animate([{ transform: `translateY(${drop(i)}px)` }, { transform: "translateY(0)" }], {
                duration: FLASH_OUT,
                easing: EASE_OUT,
                delay: n * FLASH_STAGGER,
                fill: "forwards",
              })
            )
          );
        await Promise.all(up.map((a) => a.finished));
      } catch {
        /* cancelled (unmount or re-trigger) */
      } finally {
        running.current.forEach((a) => a.cancel());
        running.current = [];
      }
    },
  }));

  const fine = hasFinePointer();
  let k = 0;
  const d = () => ({ ["--m-delay" as string]: `${(0.2 + (k++) * 0.13).toFixed(2)}s` });

  return (
    <svg
      viewBox="0 0 360 400"
      role="img"
      aria-label="Figure 1: an exploded isometric phone. Four partition slabs (userdata, vendor, system, boot) rise off the device, with root marked as a vermilion dot on the boot slab."
      className="h-auto w-full max-w-[420px] overflow-visible text-ink"
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      strokeLinecap="round"
      data-active={active ? "" : undefined}
    >
      {/* exploded-view guides + the device: depth 1 */}
      <g className="fig-parallax" style={depthStyle(1)}>
        <g className="m-rise" style={{ ["--m-delay" as string]: "0.9s", ["--rise-y" as string]: "0px" }} stroke="var(--color-rule-strong)" strokeDasharray="2 4">
          <path d={`M${p(at(PHONE_Y, 0, L))}V${r(at(32, 0, L)[1])}`} />
          <path d={`M${p(at(PHONE_Y, W, 0))}V${r(at(32, W, 0)[1])}`} />
          <path d={`M${p(at(PHONE_Y, W, L))}V${r(at(32, W, L)[1])}`} />
        </g>
        <path className="m-draw" style={d()} pathLength={1} fill="var(--color-paper)" d={slab(PHONE_Y, 12)} />
        <path className="m-draw" style={d()} pathLength={1} d={face(PHONE_Y, 8, 10, W - 8, L - 10) + line(PHONE_Y, W / 2 - 12, 5, W / 2 + 12, 5)} />
      </g>

      {/* partition slabs */}
      {SLABS.map((s, i) => {
        const [lx, ly] = at(s.oy, W, 0);
        return (
          <g key={s.key} className="fig-parallax" style={depthStyle(s.depth)}>
            <g className="fig-flash" ref={(el) => { flashEls.current[i] = el; }}>
              <g
                className="slab"
                data-slab={s.key}
                data-on={active === s.key ? "" : undefined}
                onPointerEnter={fine ? () => onActive(s.key) : undefined}
              >
                <path className="m-draw" style={d()} pathLength={1} fill="var(--color-paper)" d={slab(s.oy, 6)} />
                <path className="slab-face" stroke="none" d={face(s.oy, 0, 0, W, L)} />
                <path
                  className="m-draw"
                  style={d()}
                  pathLength={1}
                  stroke="var(--color-ink-soft)"
                  d={line(s.oy, 18, 22 + i * 6, 18, 70 + i * 6) + line(s.oy, 30, 22 + i * 6, 30, 52 + i * 6) + line(s.oy, 42, 22 + i * 6, 42, 88)}
                />
                {/* leader + label travel with their slab */}
                <g
                  className="m-rise"
                  style={{ ["--m-delay" as string]: `${0.7 + i * 0.07}s`, ["--rise-y" as string]: "6px" }}
                  fontFamily="var(--font-mono)"
                  fontSize="9.5"
                  letterSpacing="1.4"
                >
                  <path d={`M${r(lx + 6)} ${r(ly)}H292`} stroke="var(--color-ink)" fill="none" />
                  <text
                    x="298"
                    y={r(ly + 3.4)}
                    stroke="none"
                    fill={active === s.key ? "var(--color-vermilion-ink)" : "var(--color-ink-soft)"}
                  >
                    {s.label}
                  </text>
                </g>

                {s.key === "boot" && (
                  <>
                    <g
                      className="m-rise"
                      style={{ ["--m-delay" as string]: "1.05s", ["--rise-y" as string]: "6px" }}
                      fontFamily="var(--font-mono)"
                      fontSize="9.5"
                      letterSpacing="1.4"
                    >
                      <path d={`M${r(ROOT_DOT[0] - 8)} ${r(ROOT_DOT[1] - 6)}L64 20H22`} stroke="var(--color-ink)" fill="none" />
                      <text x="22" y="14" stroke="none" fill="var(--color-vermilion-ink)">ROOT</text>
                    </g>
                    {/* the one vermilion mark */}
                    <g className="m-rise" style={{ ["--m-delay" as string]: "1.0s", ["--rise-y" as string]: "0px" }}>
                      <g className="fig-pulse" ref={pulseEl}>
                        <circle cx={r(ROOT_DOT[0])} cy={r(ROOT_DOT[1])} r="9" stroke="var(--color-vermilion)" />
                        <circle cx={r(ROOT_DOT[0])} cy={r(ROOT_DOT[1])} r="4.5" fill="var(--color-vermilion)" stroke="none" />
                      </g>
                    </g>
                  </>
                )}
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
});
