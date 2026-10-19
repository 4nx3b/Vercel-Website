import { cn } from "../utils/cn";
import { useInView } from "../hooks/useInView";
import type { Tone } from "../lib/data";

const TONE_COLOR: Record<Tone, string> = {
  orange: "#ee6018",
  green: "#a0ca92",
};

/** 1px-stroke instrument sparkline. Draws itself once in view. */
export function Sparkline({
  data,
  tone,
  className,
  height = 40,
}: {
  data: number[];
  tone: Tone;
  className?: string;
  height?: number;
}) {
  const { ref, inView } = useInView<SVGSVGElement>(0.4);
  const w = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - 4 - ((v - min) / span) * (height - 8);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const [lx, ly] = pts[pts.length - 1];
  const color = TONE_COLOR[tone];

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn("block h-10 w-full", className)}
      aria-hidden
    >
      <path
        d={area}
        fill={color}
        opacity={inView ? 0.07 : 0}
        style={{ transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1) 0.3s" }}
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={inView ? 0 : 1}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <circle
        cx={lx}
        cy={ly}
        r={1.8}
        fill={color}
        opacity={inView ? 1 : 0}
        style={{ transition: "opacity 0.2s cubic-bezier(0.4,0,0.2,1) 0.85s" }}
      />
    </svg>
  );
}
