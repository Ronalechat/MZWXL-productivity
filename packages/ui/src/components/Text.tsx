import type { CSSProperties, ReactNode } from "react";

export type Attention = "ambient" | "default" | "notable" | "urgent";
type TextAs = "p" | "span" | "div" | "li";
export type TextSize = "xs" | "sm" | "base" | "lg";

export interface TextProps {
  children: ReactNode;
  attention?: Attention;
  size?: TextSize;
  mono?: boolean;
  label?: boolean;
  dropCap?: boolean;
  as?: TextAs;
  className?: string;
  style?: CSSProperties;
}

const attentionStyles: Record<Attention, CSSProperties> = {
  ambient: { color: "var(--text-muted)", fontWeight: 400 },
  default: { color: "var(--text-secondary)" },
  notable: { color: "var(--text)", fontWeight: 500 },
  urgent:  { color: "var(--accent)", fontWeight: 600, fontFamily: "var(--font-urgent)" },
};

const fontSizes: Record<TextSize, string> = {
  xs:   "0.72rem",
  sm:   "0.82rem",
  base: "0.975rem",
  lg:   "1.1rem",
};

export function Text({
  children,
  attention = "default",
  size,
  mono = false,
  label = false,
  dropCap = false,
  as: Tag = "p",
  className,
  style,
}: TextProps) {
  const classes = [dropCap ? "drop-cap" : "", className]
    .filter(Boolean)
    .join(" ");

  const fontFamily = mono
    ? "var(--font-mono)"
    : attention === "urgent"
    ? "var(--font-urgent)"
    : "var(--font-body)";

  return (
    <Tag
      className={classes || undefined}
      style={{
        fontFamily,
        lineHeight: 1.7,
        margin: 0,
        ...(size ? { fontSize: fontSizes[size] } : {}),
        ...(label ? { textTransform: "uppercase", letterSpacing: "0.07em" } : {}),
        ...attentionStyles[attention],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
