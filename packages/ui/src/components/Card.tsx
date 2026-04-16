import type { CSSProperties, ReactNode } from "react";
import type { Attention } from "./Text.js";

type CardVariant = "card" | "ruled" | "flush";

export interface CardProps {
  children: ReactNode;
  attention?: Attention;
  variant?: CardVariant;
  className?: string;
  style?: CSSProperties;
}

const stylesByAttention: Record<Attention, CSSProperties> = {
  ambient: {
    background:  "var(--bg)",
    border:      "1px solid var(--border)",
    color:       "var(--text-muted)",
  },
  default: {
    background:  "var(--bg-surface)",
    border:      "1px solid var(--border)",
    color:       "var(--text)",
  },
  notable: {
    background:  "var(--bg-raised)",
    border:      "1px solid var(--accent-dim)",
    color:       "var(--text)",
  },
  urgent: {
    background:  "var(--bg-raised)",
    border:      "2px solid var(--accent)",
    color:       "var(--text)",
  },
};

export function Card({ children, attention = "default", variant = "card", className, style }: CardProps) {
  const variantStyles: CSSProperties =
    variant === "ruled"
      ? { borderRadius: 0, border: "none", padding: "12px 0" }
      : variant === "flush"
        ? { borderRadius: 0, border: "none", borderLeft: "var(--rule-weight, 3px) solid var(--accent)", padding: "14px 16px" }
        : { borderRadius: "12px", padding: "16px 20px" };

  return (
    <div
      className={`${variant === "ruled" ? "mz-ruled-row" : ""} ${className ?? ""}`.trim()}
      style={{
        ...stylesByAttention[attention],
        ...variantStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
