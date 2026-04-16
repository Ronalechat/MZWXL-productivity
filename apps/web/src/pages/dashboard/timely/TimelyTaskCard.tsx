import { useState } from "react";
import { Heading, Text, Card, Badge } from "@mzwxl/ui";
import type { TimelyTask } from "../../../data/tasks.js";
import { getUrgencyTier, formatDateRange } from "../../../utils/urgency.js";

export function TimelyTaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: TimelyTask;
  onEdit: (task: TimelyTask) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverPinned, setPopoverPinned] = useState(false);
  const tier = getUrgencyTier(task);
  const urgencyColor = `var(--urgency-${tier})`;
  const showPopover = hovered || popoverPinned;
  const hasPopoverContent = !!(task.image || task.details);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showPopover && hasPopoverContent && (
        <div
          onClick={() => setPopoverPinned((v) => !v)}
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "-16px",
            right: "-16px",
            background: "var(--bg-raised)",
            border: `var(--rule-weight-light) solid var(--border)`,
            borderLeft: `3px solid ${urgencyColor}`,
            zIndex: 50,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {task.image && (
            <img
              src={task.image}
              alt=""
              style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
            />
          )}
          {task.details && (
            <div style={{ padding: "10px 12px" }}>
              <Text attention="ambient" size="sm" as="p" style={{ lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                {task.details}
              </Text>
            </div>
          )}
        </div>
      )}

      <div onTouchStart={() => setPopoverPinned((v) => !v)}>
        <Card
          variant="flush"
          className="mz-flex-col"
          style={{ gap: "0", borderLeft: `3px solid ${urgencyColor}`, paddingLeft: "10px" }}
        >
          {task.image && (
            <div style={{ marginBottom: "6px", marginLeft: "-10px", marginRight: 0, overflow: "hidden", height: "48px" }}>
              <img src={task.image} alt="" style={{ width: "100%", height: "48px", objectFit: "cover", display: "block" }} />
            </div>
          )}

          <div className="mz-flex-row" style={{ alignItems: "flex-start", gap: "4px" }}>
            <Heading
              level={5}
              style={{
                flex: 1,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                color: urgencyColor,
                fontFamily: tier === 3 ? "var(--font-urgent)" : undefined,
              }}
            >
              {task.title}
            </Heading>
            <button
              aria-label="Edit"
              onClick={() => onEdit(task)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px", lineHeight: 1 }}
            >
              ✎
            </button>
            <button
              aria-label="Delete"
              onClick={() => onDelete(task.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <Text
            attention="ambient"
            size="sm"
            as="span"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginTop: "4px",
            }}
          >
            {task.reason}
          </Text>

          {task.dateRange && (
            <Badge
              variant="urgent"
              shape="rect"
              uppercase
              style={{ alignSelf: "flex-start", marginTop: "6px", borderColor: urgencyColor, color: urgencyColor }}
            >
              {formatDateRange(task.dateRange)}
            </Badge>
          )}
        </Card>
      </div>
    </div>
  );
}
