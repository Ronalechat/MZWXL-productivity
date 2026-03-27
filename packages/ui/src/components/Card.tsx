import type { CSSProperties, ReactNode } from "react";
import type { Attention } from "./Text.js";

export interface CardProps {
  children: ReactNode;
  attention?: Attention;
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

export function Card({ children, attention = "default", className, style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: "12px",
        padding:      "16px 20px",
        ...stylesByAttention[attention],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
