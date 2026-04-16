import { useState, useRef } from "react";
import { Text } from "@mzwxl/ui";

export function AddTaskRow({ onAdd }: { onAdd: (title: string, time?: string, notes?: string) => void }) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  function activate() {
    setActive(true);
    setTimeout(() => titleRef.current?.focus(), 30);
  }

  function submit() {
    const t = title.trim();
    if (t) {
      onAdd(t, time || undefined, notes.trim() || undefined);
      setTitle("");
      setTime("");
      setNotes("");
      setActive(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setActive(false); setTitle(""); setTime(""); setNotes(""); }
  }

  if (!active) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(e) => e.key === "Enter" && activate()}
        className="mz-flex-row mz-ruled-row"
        style={{ gap: "10px", padding: "10px 0", cursor: "pointer", opacity: 0.45 }}
      >
        <span style={{
          width: "20px", height: "20px", borderRadius: "2px",
          border: "2px solid var(--border)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", color: "var(--text-muted)",
        }}>+</span>
        <span style={{ width: "64px", flexShrink: 0 }} />
        <Text as="span" size="sm" attention="ambient">Add task…</Text>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    border: "none",
    borderBottom: "2px solid var(--accent)",
    background: "transparent",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    color: "var(--text)",
    outline: "none",
    padding: "0",
    lineHeight: "20px",
  };

  return (
    <div className="mz-flex-col" style={{ borderBottom: "var(--rule-weight) solid var(--border)" }}>
      <div className="mz-flex-row" style={{ gap: "10px", padding: "10px 0" }}>
        <span style={{
          width: "20px", height: "20px", borderRadius: "2px",
          border: "2px solid var(--accent)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", color: "var(--accent)",
        }}>+</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...inputStyle, width: "64px", flexShrink: 0 }}
        />
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (!title.trim()) { setActive(false); setTime(""); setNotes(""); } }}
          placeholder="Task name…"
          style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 700 }}
        />
      </div>
      <div style={{ paddingLeft: "94px", paddingBottom: "10px" }}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Notes… (optional)"
          rows={2}
          style={{
            width: "100%", background: "transparent", border: "none",
            borderBottom: "1px solid var(--border)", color: "var(--text-muted)",
            fontFamily: "var(--font-body)", fontSize: "0.8rem", lineHeight: 1.6,
            resize: "none", outline: "none", padding: "2px 0",
          }}
        />
      </div>
    </div>
  );
}
