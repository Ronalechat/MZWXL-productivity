import { useState } from "react";
import { Text } from "@mzwxl/ui";
import type { Nudge } from "../../../lib/api.js";

export function NudgeManagerPanel({
  nudges,
  onAdd,
  onDelete,
  onUpdate,
  onClose,
}: {
  nudges: Nudge[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onClose: () => void;
}) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    onAdd(text);
    setNewText("");
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "36px",
        right: 0,
        width: "320px",
        maxHeight: "400px",
        background: "var(--bg-surface)",
        borderTop: "var(--rule-weight-light) solid var(--border)",
        borderLeft: "var(--rule-weight-light) solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px 14px 6px", borderBottom: "var(--rule-weight-light) solid var(--border)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text size="xs" attention="default" as="span" label style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Nudges</Text>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px" }}>
        {nudges.map((nudge) => (
          <div key={nudge.id} className="mz-flex-row" style={{ gap: "6px", alignItems: "center", padding: "5px 0", borderBottom: "var(--rule-weight-light) solid var(--border)" }}>
            {editingId === nudge.id ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { onUpdate(nudge.id, editText.trim()); setEditingId(null); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--accent)", outline: "none", fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text)", padding: "1px 0" }}
                />
                <button onClick={() => { onUpdate(nudge.id, editText.trim()); setEditingId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.7rem" }}>✓</button>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.7rem" }}>×</button>
              </>
            ) : (
              <>
                <Text size="sm" as="span" style={{ flex: 1 }}>{nudge.text}</Text>
                <button onClick={() => { setEditingId(nudge.id); setEditText(nudge.text); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.72rem" }}>✎</button>
                <button onClick={() => onDelete(nudge.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.72rem" }}>×</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 14px", borderTop: "var(--rule-weight-light) solid var(--border)", flexShrink: 0, display: "flex", gap: "6px" }}>
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add nudge…"
          style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--border)", outline: "none", fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text)", padding: "2px 0" }}
        />
        <button
          onClick={handleAdd}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "0 4px" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
