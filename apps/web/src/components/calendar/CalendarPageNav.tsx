import { CalendarNavArrows } from "./CalendarNavArrows.js";
import { CalendarViewSwitcher } from "./CalendarViewSwitcher.js";

export function CalendarPageNav({
  label,
  onPrev,
  onNext,
  active,
  weekFromStr,
}: {
  label: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  active: "day" | "week" | "month";
  weekFromStr?: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 32px 16px",
      flexShrink: 0,
      borderBottom: "var(--rule-weight-light) solid var(--border)",
    }}>
      <CalendarNavArrows label={label} onPrev={onPrev} onNext={onNext} />
      <CalendarViewSwitcher active={active} weekFromStr={weekFromStr} />
    </div>
  );
}
