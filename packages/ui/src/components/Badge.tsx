import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "neutral" | "default" | "notable" | "urgent";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  shape?: "pill" | "rect";
  uppercase?: boolean;
  className?: string;
  style?: CSSProperties;
}

const stylesByVariant: Record<BadgeVariant, CSSProperties> = {
  neutral: {
    background:  "var(--bg-surface)",
    color:       "var(--text-muted)",
    border:      "1px solid var(--border)",
  },
  default: {
    background:  "var(--accent-dim)",
    color:       "var(--text)",
    border:      "1px solid var(--border)",
  },
  notable: {
    background:  "var(--accent-dim)",
    color:       "var(--accent)",
    border:      "1px solid var(--accent)",
  },
  urgent: {
    background:  "var(--accent)",
    color:       "var(--bg)",
    border:      "1px solid var(--accent)",
    fontFamily:  "var(--font-urgent)",
    fontWeight:  700,
    letterSpacing: "0.04em",
  },
};

export function Badge({ children, variant = "default", shape = "pill", uppercase, className, style }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        padding:       "2px 8px",
        borderRadius:  shape === "rect" ? "2px" : "9999px",
        fontSize:      "0.75rem",
        fontWeight:    500,
        lineHeight:    1.6,
        ...(uppercase ? { textTransform: "uppercase", letterSpacing: "0.08em" } : {}),
        ...stylesByVariant[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
