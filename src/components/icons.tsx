import type { JSX, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

export const ArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12h15M14 6.5 19.5 12 14 17.5" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 17.5 17.5 6.5M8.5 6.5h9v9" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" />
    <path d="M15.5 8.5v-4h-11v11h4" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4.5 12.5 5 5L19.5 6.5" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5.5 5.5 13 13m0-13-13 13" />
  </svg>
);

export const RefreshIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 3.5v4h-4" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5.5 5.5" />
  </svg>
);

export const GitHubIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5.1 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 4-2.4 4.8-4.6 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2Z" />
  </svg>
);

export const TelegramIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m3 11.5 17.5-7-4 15-5.5-4.5L8 18l-.5-4L3 11.5Z" />
    <path d="M8 18v-3.5L17 6.5" />
  </svg>
);

/* ---------- Skill glyphs — monochrome, 1px-stroke, instrument-drawn ---------- */

export const SkillGlyphs: Record<string, (p: P) => JSX.Element> = {
  boot: (p: P) => (
    <svg {...base} {...p}>
      <path d="M12 3v8M8.5 6.5 12 3l3.5 3.5" />
      <path d="M5 12.5v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
    </svg>
  ),
  module: (p: P) => (
    <svg {...base} {...p}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M17 14v6M14 17h6" />
    </svg>
  ),
  kernel: (p: P) => (
    <svg {...base} {...p}>
      <rect x="6.5" y="6.5" width="11" height="11" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9 6.5V3M15 6.5V3M9 21v-3.5M15 21v-3.5M6.5 9H3M6.5 15H3M21 9h-3.5M21 15h-3.5" />
    </svg>
  ),
  rom: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
    </svg>
  ),
  port: (p: P) => (
    <svg {...base} {...p}>
      <path d="M14.5 3.5a8.5 8.5 0 1 0 0 17 7 7 0 0 1 0-17Z" />
      <path d="M17 12h4M19 10l2 2-2 2" />
    </svg>
  ),
  adb: (p: P) => (
    <svg {...base} {...p}>
      <rect x="2.5" y="4.5" width="19" height="15" />
      <path d="m6 9 3.5 3L6 15M12.5 15.5H18" />
    </svg>
  ),
  bash: (p: P) => (
    <svg {...base} {...p}>
      <path d="m4 6 6 6-6 6M13 18h7" />
    </svg>
  ),
  selinux: (p: P) => (
    <svg {...base} {...p}>
      <path d="M12 3 5 5.5v6c0 4.5 3 7.5 7 9.5 4-2 7-5 7-9.5v-6L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </svg>
  ),
  partition: (p: P) => (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <path d="M3.5 9.5h17M3.5 15h17M10 3.5v6M14.5 9.5V15M8 15v5.5" />
    </svg>
  ),
  git: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="6.5" cy="6" r="2.5" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M6.5 8.5v7M17.5 11.5c0 4-5 3.5-8.5 4.5" />
    </svg>
  ),
  cpu: (p: P) => (
    <svg {...base} {...p}>
      <rect x="5" y="5" width="14" height="14" />
      <path d="M9 9h6v6H9zM9 5V2.5M15 5V2.5M9 21.5V19M15 21.5V19M5 9H2.5M5 15H2.5M21.5 9H19M21.5 15H19" />
    </svg>
  ),
  tree: (p: P) => (
    <svg {...base} {...p}>
      <rect x="9" y="3" width="6" height="5" />
      <rect x="3" y="16" width="6" height="5" />
      <rect x="15" y="16" width="6" height="5" />
      <path d="M12 8v4M6 16v-2h12v2M12 12v2" />
    </svg>
  ),
  branch: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="6.5" cy="6" r="2.5" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M6.5 8.5v7M17.5 11.5c0 4-5 3.5-8.5 4.5" />
    </svg>
  ),
  bolt: (p: P) => (
    <svg {...base} {...p}>
      <path d="M13 2.5 4.5 13.5H11L9.5 21.5 19 10h-6.5L13 2.5Z" />
    </svg>
  ),
  shield: (p: P) => (
    <svg {...base} {...p}>
      <path d="M12 3 5 5.5v6c0 4.5 3 7.5 7 9.5 4-2 7-5 7-9.5v-6L12 3Z" />
    </svg>
  ),
  layers: (p: P) => (
    <svg {...base} {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m4.5 12.5 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" />
    </svg>
  ),
  torii: (p: P) => (
    <svg {...base} {...p}>
      <path d="M3 5.5c3-1.5 15-1.5 18 0M5 5v3M19 5v3M4 8.5h16M7 8.5V21M17 8.5V21M7 13h10" />
    </svg>
  ),
  gamepad: (p: P) => (
    <svg {...base} {...p}>
      <path d="M7 7h10a5 5 0 0 1 5 5.5c-.2 2-1.5 4-3 4-2.5 0-2.5-2.5-7-2.5s-4.5 2.5-7 2.5c-1.5 0-2.8-2-3-4A5 5 0 0 1 7 7Z" />
      <path d="M8 10.5v3M6.5 12h3M15.5 10.5h.01M17.5 12.5h.01" />
    </svg>
  ),
  note: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="7.5" cy="17.5" r="3" />
      <circle cx="17.5" cy="15" r="3" />
      <path d="M10.5 17.5V6l10-2.5V15" />
    </svg>
  ),
};
