import { useState, useRef } from "react";
import { Text } from "@mzwxl/ui";
import type { TimelyTask } from "../../../data/tasks.js";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: "0.8rem",
  outline: "none",
  padding: "3px 0",
  marginBottom: "6px",
};

function blankForm() {
  return { title: "", reason: "", details: "", image: "", dateFrom: "", dateTo: "" };
}

function FormFields({
  form,
  setForm,
  imageInputRef,
  onPaste,
}: {
  form: ReturnType<typeof blankForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof blankForm>>>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onPaste: (e: React.ClipboardEvent) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "8px 0" }}>
      <input placeholder="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
      <input placeholder="Reason *" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} style={inputStyle} />
      <textarea placeholder="Details (popover)" value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <input
        placeholder="Image URL or paste image below"
        value={form.image.startsWith("data:") ? "(pasted image)" : form.image}
        onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
        onPaste={onPaste}
        style={inputStyle}
      />
      <div className="mz-flex-row" style={{ gap: "6px", alignItems: "center" }}>
        <Text size="xs" attention="ambient" as="span">or</Text>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = (ev) => setForm((prev) => ({ ...prev, image: ev.target?.result as string }));
              reader.readAsDataURL(f);
            }
          }}
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: 0 }}
        >
          choose file
        </button>
        {form.image && (
          <button
            onClick={() => setForm((f) => ({ ...f, image: "" }))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.7rem", padding: 0 }}
          >
            clear
          </button>
        )}
      </div>
      <div className="mz-flex-row" style={{ gap: "8px" }}>
        <input type="date" placeholder="From" value={form.dateFrom} onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
        <input type="date" placeholder="To" value={form.dateTo} onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
      </div>
    </div>
  );
}

export function TimelyManager({
  tasks,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  tasks: TimelyTask[];
  onClose: () => void;
  onAdd: (data: Omit<TimelyTask, "id" | "createdAt">) => void;
  onUpdate: (id: string, data: Partial<Omit<TimelyTask, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankForm());
  const imageInputRef = useRef<HTMLInputElement>(null);

  function startEdit(task: TimelyTask) {
    setEditingId(task.id);
    setShowAdd(false);
    setForm({
      title: task.title,
      reason: task.reason,
      details: task.details ?? "",
      image: task.image ?? "",
      dateFrom: task.dateRange?.from ?? "",
      dateTo: task.dateRange?.to ?? "",
    });
  }

  function saveEdit() {
    if (!editingId) return;
    onUpdate(editingId, {
      title: form.title,
      reason: form.reason,
      details: form.details || undefined,
      image: form.image || undefined,
      dateRange: (form.dateFrom || form.dateTo) ? { from: form.dateFrom || undefined, to: form.dateTo || undefined } : undefined,
    });
    setEditingId(null);
    setForm(blankForm());
  }

  function submitAdd() {
    if (!form.title || !form.reason) return;
    onAdd({
      title: form.title,
      reason: form.reason,
      details: form.details || undefined,
      image: form.image || undefined,
      dateRange: (form.dateFrom || form.dateTo) ? { from: form.dateFrom || undefined, to: form.dateTo || undefined } : undefined,
    });
    setShowAdd(false);
    setForm(blankForm());
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setForm((f) => ({ ...f, image: ev.target?.result as string }));
        reader.readAsDataURL(file);
      }
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: "36px",
        width: "288px",
        background: "var(--bg-surface)",
        borderLeft: "var(--rule-weight) solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        overflow: "hidden auto",
        padding: "12px 16px 20px",
      }}
    >
      <div className="mz-flex-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <Text size="xs" attention="default" as="span" label style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Manage Timely</Text>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>×</button>
      </div>

      {tasks.map((task) => (
        <div key={task.id} style={{ borderBottom: "var(--rule-weight-light) solid var(--border)", paddingBottom: "8px", marginBottom: "8px" }}>
          {editingId === task.id ? (
            <>
              <FormFields form={form} setForm={setForm} imageInputRef={imageInputRef} onPaste={handlePaste} />
              <div className="mz-flex-row" style={{ gap: "8px", marginTop: "4px" }}>
                <button onClick={saveEdit} style={{ background: "var(--accent)", border: "none", cursor: "pointer", color: "var(--bg)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "4px 10px" }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "4px 0" }}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="mz-flex-row" style={{ alignItems: "center", gap: "6px" }}>
              <Text size="sm" as="span" style={{ flex: 1 }}>{task.title}</Text>
              <button onClick={() => startEdit(task)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem" }}>✎</button>
              <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem" }}>×</button>
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <div style={{ marginTop: "8px" }}>
          <FormFields form={form} setForm={setForm} imageInputRef={imageInputRef} onPaste={handlePaste} />
          <div className="mz-flex-row" style={{ gap: "8px", marginTop: "4px" }}>
            <button onClick={submitAdd} style={{ background: "var(--accent)", border: "none", cursor: "pointer", color: "var(--bg)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "4px 10px" }}>Add</button>
            <button onClick={() => { setShowAdd(false); setForm(blankForm()); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "4px 0" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm(blankForm()); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 0", textAlign: "left" }}
        >
          + Add timely task
        </button>
      )}
    </div>
  );
}
