import type { CSSProperties, ReactNode } from "react";

export interface AlertProps {
  children: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function Alert({ children, title, className, style }: AlertProps) {
  return (
    <div
      className={className}
      style={{
        background:   "var(--bg-raised)",
        borderLeft:   "4px solid var(--accent)",
        borderRadius: "0 10px 10px 0",
        padding:      "14px 18px",
        animation:    "mzwxl-pulse-border 2s ease-in-out infinite",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily:    "var(--font-urgent)",
            fontSize:      "0.875rem",
            fontWeight:    700,
            color:         "var(--accent)",
            marginBottom:  "6px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize:   "0.875rem",
          lineHeight: 1.6,
          color:      "var(--text-secondary)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
