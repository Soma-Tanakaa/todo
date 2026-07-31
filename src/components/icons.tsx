import type { SVGProps } from "react";

export type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function svgProps({
  size = 18,
  className,
  strokeWidth = 2,
}: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
}

export function IconBack(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconDrag(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M4 9h16M4 15h16" />
    </svg>
  );
}

export function IconDots(p: IconProps) {
  return (
    <svg {...svgProps(p)} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowUpRight(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function IconRepeat(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function IconFlag(p: IconProps) {
  return (
    <svg {...svgProps(p)} fill="currentColor">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" fill="none" />
    </svg>
  );
}

export function IconCornerUpLeft(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M9 14 4 9l5-5" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}
