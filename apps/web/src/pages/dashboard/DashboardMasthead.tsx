import { Link } from "react-router";
import { motion } from "motion/react";
import { Text } from "@mzwxl/ui";

const navBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: "0.9rem",
  padding: "2px 8px 2px 0",
  lineHeight: 1,
};

export function DashboardMasthead({
  date,
  isToday,
  clockTime,
  onPrev,
  onNext,
  onToday,
}: {
  date: Date;
  isToday: boolean;
  clockTime: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <div className="mz-flex-row" style={{ alignItems: "flex-end", gap: "28px", marginBottom: "20px" }}>
      <motion.div layoutId="cal-date" style={{ flexShrink: 0 }}>
        <Link to={`/calendar/week?selected=${dateStr}`} style={{ textDecoration: "none" }} title="Open week view">
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "9rem",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              color: "var(--accent)",
              opacity: 1,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
          >
            {date.getDate()}
          </div>
        </Link>
      </motion.div>

      <div className="mz-flex-col" style={{ gap: "5px", paddingBottom: "12px" }}>
        <div className="mz-flex-row" style={{ gap: "0", alignItems: "center" }}>
          <button aria-label="Previous day" onClick={onPrev} style={navBtn}>←</button>
          <button aria-label="Next day" onClick={onNext} style={{ ...navBtn, padding: "2px 0" }}>→</button>
          {!isToday && (
            <button
              onClick={onToday}
              style={{
                marginLeft: "10px", background: "none", border: "none",
                cursor: "pointer", padding: 0,
                fontFamily: "var(--font-mono)", fontSize: "0.62rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Today
            </button>
          )}
        </div>
        <Text size="xs" attention="default" as="span" label>{date.toLocaleDateString("en-AU", { weekday: "long" })}</Text>
        <Text size="xs" attention="ambient" as="span">{date.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</Text>
        {isToday && (
          <Text mono size="xs" attention="ambient" as="span" style={{ letterSpacing: "0.06em" }}>
            {clockTime}
          </Text>
        )}
      </div>
    </div>
  );
}
