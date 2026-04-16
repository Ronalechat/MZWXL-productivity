import { Link } from "react-router";

const btn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: "0.62rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "4px 8px",
  borderRadius: "3px",
};

export function CalendarViewSwitcher({
  active,
  weekFromStr,
}: {
  active: "day" | "week" | "month";
  weekFromStr?: string;
}) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {active === "day" ? (
        <button style={{ ...btn, color: "var(--accent)", background: "var(--accent-dim)" }} disabled>Day</button>
      ) : (
        <Link to="/" style={{ textDecoration: "none" }}>
          <button style={{ ...btn, color: "var(--text-muted)" }}>Day</button>
        </Link>
      )}

      {active === "week" ? (
        <button style={{ ...btn, color: "var(--accent)", background: "var(--accent-dim)" }} disabled>Week</button>
      ) : (
        <Link to={weekFromStr ? `/calendar/week?selected=${weekFromStr}` : "/calendar/week"} style={{ textDecoration: "none" }}>
          <button style={{ ...btn, color: "var(--text-muted)" }}>Week</button>
        </Link>
      )}

      {active === "month" ? (
        <button style={{ ...btn, color: "var(--accent)", background: "var(--accent-dim)" }} disabled>Month</button>
      ) : (
        <Link to="/calendar/month" style={{ textDecoration: "none" }}>
          <button style={{ ...btn, color: "var(--text-muted)" }}>Month</button>
        </Link>
      )}
    </div>
  );
}
