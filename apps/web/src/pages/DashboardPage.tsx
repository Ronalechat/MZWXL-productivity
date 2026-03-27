import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Heading, Text, Card, Badge } from "@mzwxl/ui";
import { TIMELY_TASKS, DAILY_TASKS } from "../data/tasks.js";
import type { TimelyTask, DailyTask } from "../data/tasks.js";
import { DashboardChat } from "../components/DashboardChat.js";
import { fetchTodayEvents } from "../lib/chat.js";
import type { CalendarEvent } from "../lib/chat.js";

// ---- Utilities -------------------------------------------------------

function formatDateRange(range: NonNullable<TimelyTask["dateRange"]>): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`;
  if (range.to) return `Due ${fmt(range.to)}`;
  if (range.from) return `From ${fmt(range.from)}`;
  return "";
}

// ---- Timely task card ------------------------------------------------

function TimelyTaskCard({ task }: { task: TimelyTask }) {
  return (
    <Card attention="urgent" className="mz-flex-col" style={{ gap: "6px" }}>
      <Heading level={5} urgency="urgent">{task.title}</Heading>
      <Text attention="ambient" size="sm" as="span">{task.reason}</Text>
      {task.dateRange && (
        <Badge variant="urgent" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
          {formatDateRange(task.dateRange)}
        </Badge>
      )}
    </Card>
  );
}

// ---- Daily task item -------------------------------------------------

function DailyTaskItem({ task }: { task: DailyTask }) {
  const [done, setDone] = useState(task.done ?? false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => task.notes && setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && task.notes && setExpanded((v) => !v)}
        className="mz-flex-row"
        style={{
          gap: "14px",
          padding: "11px 16px",
          borderRadius: "10px",
          cursor: task.notes ? "pointer" : "default",
          background: expanded ? "var(--bg-surface)" : "transparent",
          opacity: done ? 0.4 : 1,
          transition: "background 0.15s, opacity 0.2s",
        }}
      >
        {/* Checkbox */}
        <button
          aria-label={done ? "Mark incomplete" : "Mark complete"}
          onClick={(e) => {
            e.stopPropagation();
            setDone((v) => !v);
          }}
          className="mz-flex-row"
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
            background: done ? "var(--accent)" : "transparent",
            flexShrink: 0,
            cursor: "pointer",
            justifyContent: "center",
            color: "var(--bg)",
            fontSize: "11px",
            transition: "all 0.15s",
          }}
        >
          {done ? "✓" : ""}
        </button>

        {/* Title */}
        <Text
          as="span"
          size="base"
          attention="notable"
          style={{ flex: 1, textDecoration: done ? "line-through" : "none" }}
        >
          {task.title}
        </Text>

        {/* Time */}
        {task.time && (
          <Text as="span" size="xs" mono attention="ambient" style={{ flexShrink: 0 }}>
            {task.time}
          </Text>
        )}

        {/* Expand indicator */}
        {task.notes && (
          <Text
            as="span"
            size="xs"
            attention="ambient"
            style={{
              flexShrink: 0,
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.15s",
            }}
          >
            ▾
          </Text>
        )}
      </div>

      {/* Expanded notes */}
      {expanded && task.notes && (
        <div style={{ paddingLeft: "50px", paddingRight: "16px", paddingBottom: "12px" }}>
          <Text attention="ambient" size="sm" as="p" style={{ lineHeight: 1.6 }}>
            {task.notes}
          </Text>
        </div>
      )}
    </div>
  );
}

// ---- Calendar event item ---------------------------------------------

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true });
}

function CalendarEventItem({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="mz-flex-row"
      style={{ gap: "12px", padding: "8px 16px", borderLeft: "2px solid var(--accent-dim)" }}
    >
      <Text mono size="xs" attention="ambient" as="span" style={{ flexShrink: 0, minWidth: "72px" }}>
        {event.allDay ? "All day" : formatTime(event.start)}
      </Text>
      <Text size="sm" as="span">{event.title}</Text>
    </div>
  );
}

// ---- Page ------------------------------------------------------------

export function DashboardPage() {
  const now = new Date();
  const dayNum = now.getDate().toString();
  const dayName = now.toLocaleDateString("en-AU", { weekday: "long" });
  const monthYear = now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetchTodayEvents().then(setCalEvents);
  }, []);

  const pending = DAILY_TASKS.filter((t) => !t.done).length;

  return (
    <div className="mz-flex-row" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)", alignItems: "stretch" }}>

      {/* ── Left sidebar: date + nav ── */}
      <aside
        className="mz-flex-col"
        style={{
          width: "176px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          padding: "28px 20px",
          gap: "40px",
        }}
      >
        {/* Date display */}
        <div className="mz-flex-col" style={{ gap: "2px" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "4rem",
              lineHeight: 1,
              color: "var(--accent)",
              marginBottom: "2px",
            }}
          >
            {dayNum}
          </div>
          <Text size="sm" attention="default" as="span">{dayName}</Text>
          <Text size="xs" attention="ambient" as="span">{monthYear}</Text>
        </div>

        {/* Nav */}
        <nav className="mz-flex-col" style={{ gap: "8px" }}>
          <Link
            to="/skills"
            className="mz-flex-row"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              padding: "6px 0",
              borderBottom: "1px solid var(--border)",
              gap: "6px",
            }}
          >
            <Text as="span" size="xs" attention="ambient">⚡</Text> Skills
          </Link>
        </nav>
      </aside>

      {/* ── Main: daily tasks ── */}
      <main style={{ flex: 1, overflow: "hidden auto", padding: "36px 44px" }}>
        <div className="mz-flex-row" style={{ gap: "12px", marginBottom: "28px", alignItems: "baseline" }}>
          <Heading level={1} urgency="informational">Today</Heading>
          {pending > 0 && (
            <Text attention="ambient" size="sm" as="span">{pending} remaining</Text>
          )}
        </div>

        {calEvents.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <Text
              label
              size="xs"
              attention="ambient"
              as="p"
              style={{ marginBottom: "8px", paddingLeft: "16px" }}
            >
              Calendar
            </Text>
            <div className="mz-flex-col" style={{ gap: "2px" }}>
              {calEvents.map((ev) => (
                <CalendarEventItem key={`${ev.title}-${ev.start}`} event={ev} />
              ))}
            </div>
          </div>
        )}

        <div className="mz-flex-col" style={{ gap: "2px" }}>
          {DAILY_TASKS.map((task) => (
            <DailyTaskItem key={task.id} task={task} />
          ))}
        </div>
      </main>

      {/* ── Right panel: timely tasks + chat ── */}
      <aside
        className="mz-flex-col"
        style={{
          width: "288px",
          flexShrink: 0,
          borderLeft: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Timely tasks (scrollable) */}
        <div
          className="mz-flex-col"
          style={{ flex: 1, overflow: "hidden auto", padding: "28px 20px", gap: "16px" }}
        >
          <Heading level={5} urgency="urgent" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Timely
          </Heading>
          {TIMELY_TASKS.map((task) => (
            <TimelyTaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Collapsible chat */}
        <DashboardChat />
      </aside>
    </div>
  );
}
