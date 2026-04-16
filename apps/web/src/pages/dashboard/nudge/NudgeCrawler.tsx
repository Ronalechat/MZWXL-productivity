import { useState, useEffect } from "react";
import type { Nudge } from "../../../lib/api.js";
import { createNudge, deleteNudge, updateNudge } from "../../../lib/api.js";
import { NudgeManagerPanel } from "./NudgeManagerPanel.js";

export function NudgeCrawler({ nudges }: { nudges: Nudge[] }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [localNudges, setLocalNudges] = useState<Nudge[]>(nudges);

  useEffect(() => { setLocalNudges(nudges); }, [nudges]);

  const isPaused = pinned || hovered || managerOpen;
  const separator = "\u00A0\u00A0\u00A0\u00A0·\u00A0\u00A0\u00A0\u00A0";
  const crawlerText = localNudges.length > 0
    ? localNudges.map((n) => n.text).join(separator)
    : "Add your first nudge →";

  async function handleAdd(text: string) {
    const result = await createNudge(text);
    if (result) setLocalNudges((prev) => [...prev, result]);
  }

  async function handleDelete(id: string) {
    await deleteNudge(id);
    setLocalNudges((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleUpdate(id: string, text: string) {
    if (!text) return;
    await updateNudge(id, text);
    setLocalNudges((prev) => prev.map((n) => n.id === id ? { ...n, text } : n));
  }

  function closeManager() {
    setManagerOpen(false);
    setPinned(false);
  }

  return (
    <div
      style={{
        position: "relative",
        height: "36px",
        flexShrink: 0,
        borderTop: "var(--rule-weight-light) solid var(--border)",
        background: "var(--bg-surface)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {pinned && (
        <div style={{
          position: "absolute", left: "10px", zIndex: 2,
          fontFamily: "var(--font-mono)", fontSize: "0.65rem",
          color: "var(--text-muted)", letterSpacing: "0.06em",
          pointerEvents: "none",
        }}>
          ⏸
        </div>
      )}

      <div
        onClick={() => setPinned((v) => !v)}
        style={{ cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", flex: 1, paddingRight: "48px" }}
      >
        <span
          style={{
            display: "inline-block",
            animation: `nudge-scroll 90s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
            opacity: isPaused ? 1 : 0.6,
            transition: "opacity 0.3s",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            color: "var(--text)",
          }}
        >
          {crawlerText}{separator}{crawlerText}{separator}
        </span>
      </div>

      <button
        aria-label="Manage nudges"
        onClick={(e) => { e.stopPropagation(); setManagerOpen((v) => !v); setPinned(true); }}
        style={{
          position: "absolute", right: "10px",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "1rem",
          lineHeight: 1, padding: "4px", zIndex: 2,
        }}
      >
        {managerOpen ? "×" : "+"}
      </button>

      {managerOpen && (
        <NudgeManagerPanel
          nudges={localNudges}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onClose={closeManager}
        />
      )}
    </div>
  );
}
