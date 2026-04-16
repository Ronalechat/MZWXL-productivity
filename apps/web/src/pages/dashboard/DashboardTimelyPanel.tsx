import { useState } from "react";
import type { TimelyTask } from "../../data/tasks.js";
import { sortByUrgency } from "../../utils/urgency.js";
import { TimelyTaskCard } from "./timely/TimelyTaskCard.js";
import { TimelyManager } from "./timely/TimelyManager.js";
import { DashboardChat } from "../../components/DashboardChat.js";

export function DashboardTimelyPanel({
  tasks,
  onAdd,
  onUpdate,
  onDelete,
}: {
  tasks: TimelyTask[];
  onAdd: (data: Omit<TimelyTask, "id" | "createdAt">) => void;
  onUpdate: (id: string, data: Partial<Omit<TimelyTask, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}) {
  const [managerOpen, setManagerOpen] = useState(false);
  const sortedTasks = sortByUrgency(tasks);

  return (
    <aside
      className="mz-flex-col"
      style={{
        width: "288px",
        flexShrink: 0,
        borderLeft: "var(--rule-weight) solid var(--border)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ background: "var(--accent)", padding: "20px 20px 16px", flexShrink: 0 }}>
        <div className="mz-flex-row" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <div
            className="mz-section-flag mz-section-flag--reversed"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", borderBottom: "none" }}
          >
            TIMELY
          </div>
          <button
            aria-label="Manage timely tasks"
            onClick={() => setManagerOpen((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--bg)", opacity: 0.75, fontSize: "1rem",
              padding: "4px", lineHeight: 1,
            }}
          >
            ⚙
          </button>
        </div>
        <span style={{
          color: "var(--bg)", opacity: 0.75, fontFamily: "var(--font-mono)",
          fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {sortedTasks.length} active
        </span>
      </div>

      <div className="mz-flex-col" style={{ flex: 1, overflow: "hidden auto", padding: "0 16px 20px", gap: "0" }}>
        {sortedTasks.map((task) => (
          <TimelyTaskCard
            key={task.id}
            task={task}
            onEdit={() => setManagerOpen(true)}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DashboardChat />

      {managerOpen && (
        <TimelyManager
          tasks={tasks}
          onClose={() => setManagerOpen(false)}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </aside>
  );
}
