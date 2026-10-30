import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Scroll reveal — [data-reveal] rises 18px over --dur-reveal once in view.
 * variant="focus" also resolves from blur (headings only).
 * Gated on html.js in CSS, so content is visible without JavaScript.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  style,
  id,
  variant = "rise",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
  id?: string;
  variant?: "rise" | "focus";
}) {
  const { ref, inView } = useInView<HTMLElement>(0.12);
  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={variant === "focus" ? "focus" : ""}
      data-inview={inView ? "" : undefined}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
      className={className}
    >
      {children}
    </Tag>
  );
}
