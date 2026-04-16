const navBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: "0.9rem",
  padding: "2px 8px",
  lineHeight: 1,
};

export function CalendarNavArrows({
  label,
  onPrev,
  onNext,
}: {
  label: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <button aria-label="Previous" onClick={onPrev} style={navBtn}>←</button>
      {label}
      <button aria-label="Next" onClick={onNext} style={navBtn}>→</button>
    </div>
  );
}
