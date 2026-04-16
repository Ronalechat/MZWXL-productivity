export function DashboardSectionFlag({
  label,
  pending,
}: {
  label: string;
  pending: number;
}) {
  return (
    <div
      className="mz-flex-row mz-section-flag"
      style={{
        fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "32px",
      }}
    >
      <span>{label}</span>
      {pending > 0 && (
        <span style={{
          fontSize: "0.72rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          fontWeight: 400,
          paddingBottom: "4px",
        }}>
          {pending} remaining
        </span>
      )}
    </div>
  );
}
