import type { CSSProperties, ReactNode } from "react";

export type Urgency = "informational" | "notable" | "urgent";
type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps {
  children: ReactNode;
  level?: Level;
  urgency?: Urgency;
  className?: string;
  style?: CSSProperties;
}

const fontsByUrgency: Record<Urgency, string> = {
  informational: "var(--font-heading)",
  notable:       "var(--font-heading)",
  urgent:        "var(--font-urgent)",
};

const stylesByUrgency: Record<Urgency, CSSProperties> = {
  informational: { color: "var(--text)",   fontWeight: 500 },
  notable:       { color: "var(--text)",   fontWeight: 700 },
  urgent:        { color: "var(--accent)", fontWeight: 700, letterSpacing: "0.02em" },
};

const sizesByLevel: Record<Level, string> = {
  1: "clamp(2rem, 4vw, 3rem)",
  2: "clamp(1.5rem, 3vw, 2.25rem)",
  3: "clamp(1.25rem, 2.5vw, 1.75rem)",
  4: "clamp(1.1rem, 2vw, 1.4rem)",
  5: "1.1rem",
  6: "0.9rem",
};

export function Heading({
  children,
  level = 2,
  urgency = "informational",
  className,
  style,
}: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Tag
      className={className}
      style={{
        fontFamily: fontsByUrgency[urgency],
        fontSize: sizesByLevel[level],
        lineHeight: 1.2,
        margin: 0,
        ...stylesByUrgency[urgency],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
