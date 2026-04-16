import { useState, useRef } from "react";
import { Text } from "@mzwxl/ui";
import type { CalendarEvent, Task } from "../../../lib/api.js";
import { completeTask, updateTask, updateTaskNotes } from "../../../lib/api.js";
import { formatTime, formatHHMM } from "../../../utils/dates.js";
import { CalendarIcon } from "./CalendarIcon.js";
import { Linkified } from "./Linkified.js";

export type UnifiedItem =
  | { kind: "task"; data: Task }
  | { kind: "calendar"; data: CalendarEvent };

export function UnifiedRow({
  item,
  onComplete,
  onNotesChange,
  onUpdate,
}: {
  item: UnifiedItem;
  onComplete?: (id: string) => void;
  onNotesChange?: (id: string, notes: string) => void;
  onUpdate?: (id: string, data: { title?: string; time?: string | null }) => void;
}) {
  const isCalendar = item.kind === "calendar";
  const [done, setDone] = useState(item.kind === "task" ? item.data.completed : false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.kind === "task" ? item.data.title : "");
  const [editTime, setEditTime] = useState(item.kind === "task" ? (item.data.time ?? "") : "");
  const editTitleRef = useRef<HTMLInputElement>(null);

  const calNotes = item.kind === "calendar"
    ? ([item.data.description, item.data.location, item.data.url].filter(Boolean).join("\n\n") || undefined)
    : undefined;
  const taskNotes = item.kind === "task" ? item.data.notes : "";
  const [editNotes, setEditNotes] = useState(taskNotes);

  const notes = item.kind === "task" ? (editNotes || undefined) : calNotes;
  const hasNotes = item.kind === "task" ? true : !!calNotes;

  const time = (() => {
    if (item.kind === "calendar") {
      return item.data.allDay ? "All day" : formatTime(item.data.start);
    }
    return item.data.time ? formatHHMM(item.data.time) : undefined;
  })();

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation();
    if (isCalendar || done) return;
    setDone(true);
    const id = (item.data as Task).id;
    onComplete?.(id);
    completeTask(id);
  }

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => editTitleRef.current?.focus(), 20);
  }

  function saveEdit() {
    const id = (item.data as Task).id;
    const data = {
      title: editTitle.trim() || item.data.title,
      time: editTime || null,
    };
    onUpdate?.(id, data);
    updateTask(id, data);
    setEditing(false);
  }

  function cancelEdit() {
    setEditTitle(item.kind === "task" ? item.data.title : "");
    setEditTime(item.kind === "task" ? (item.data.time ?? "") : "");
    setEditing(false);
  }

  const inputStyle: React.CSSProperties = {
    border: "none",
    borderBottom: "2px solid var(--accent)",
    background: "transparent",
    outline: "none",
    padding: "0",
    lineHeight: "20px",
    color: "var(--text)",
  };

  if (!isCalendar && editing) {
    return (
      <div
        className="mz-flex-row mz-ruled-row"
        style={{ gap: "10px", padding: "10px 0" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
          if (e.key === "Escape") cancelEdit();
        }}
      >
        <span style={{
          width: "20px", height: "20px", borderRadius: "2px",
          border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
          background: done ? "var(--accent)" : "transparent",
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", color: "var(--bg)",
        }}>{done ? "✓" : ""}</span>
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          style={{ ...inputStyle, width: "64px", flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
        />
        <input
          ref={editTitleRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 700 }}
        />
        <button onClick={saveEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.75rem", padding: "0 2px" }}>✓</button>
        <button onClick={cancelEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px" }}>×</button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !editing && setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="mz-flex-row mz-ruled-row"
        style={{ gap: "10px", padding: "10px 0", cursor: "pointer", opacity: done ? 0.4 : 1 }}
      >
        {isCalendar ? (
          <CalendarIcon />
        ) : (
          <button
            aria-label={done ? "Completed" : "Mark complete"}
            onClick={handleCheck}
            className="mz-flex-row"
            style={{
              width: "20px", height: "20px", borderRadius: "2px",
              border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
              background: done ? "var(--accent)" : "transparent",
              flexShrink: 0, cursor: done ? "default" : "pointer",
              justifyContent: "center", color: "var(--bg)",
              fontSize: "11px", transition: "all 0.15s",
            }}
          >
            {done ? "✓" : ""}
          </button>
        )}

        <Text mono size="xs" attention="ambient" as="span" style={{ flexShrink: 0, width: "64px", lineHeight: "20px" }}>
          {time ?? ""}
        </Text>

        <Text
          as="span"
          size="sm"
          attention={isCalendar ? "ambient" : "notable"}
          style={{ flex: 1, fontWeight: isCalendar ? 400 : 700, textDecoration: done ? "line-through" : "none", lineHeight: "20px" }}
        >
          {item.data.title}
        </Text>

        {!isCalendar && (
          <button
            aria-label="Edit task"
            onClick={startEdit}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px", opacity: 0.5, flexShrink: 0 }}
          >
            ✎
          </button>
        )}

        <Text as="span" size="xs" attention="ambient" style={{ flexShrink: 0, opacity: (hasNotes || expanded) ? 1 : 0.3 }}>
          {expanded ? "×" : "+"}
        </Text>
      </div>

      {expanded && (
        <div style={{ paddingLeft: "94px", paddingBottom: "10px", borderLeft: "3px solid var(--accent-dim)" }}>
          {isCalendar ? (
            notes ? (
              <Text attention="ambient" size="sm" as="p" style={{ lineHeight: 1.6, paddingLeft: "12px", whiteSpace: "pre-wrap" }}>
                <Linkified text={notes} />
              </Text>
            ) : null
          ) : (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={() => {
                const id = (item.data as Task).id;
                onNotesChange?.(id, editNotes);
                updateTaskNotes(id, editNotes);
              }}
              placeholder="Add notes…"
              rows={3}
              style={{
                width: "100%", marginLeft: "12px",
                background: "transparent", border: "none",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-muted)", fontFamily: "var(--font-body)",
                fontSize: "0.8rem", lineHeight: 1.6, resize: "vertical", outline: "none", padding: "4px 0",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
