import { useState, useEffect } from "react";
import { Text } from "@mzwxl/ui";
import type { TimelyTask } from "../../data/tasks.js";
import {
  fetchCalendarEvents,
  fetchTasks,
  createTask,
  fetchTimely,
  createTimely,
  updateTimely,
  deleteTimely,
  fetchNudges,
} from "../../lib/api.js";
import type { CalendarEvent, Task, Nudge } from "../../lib/api.js";
import { localDateStr } from "../../utils/dates.js";
import { DashboardMasthead } from "./DashboardMasthead.js";
import { DashboardSectionFlag } from "./DashboardSectionFlag.js";
import { DashboardTimelyPanel } from "./DashboardTimelyPanel.js";
import { UnifiedRow } from "./timeline/UnifiedRow.js";
import type { UnifiedItem } from "./timeline/UnifiedRow.js";
import { AddTaskRow } from "./timeline/AddTaskRow.js";
import { NudgeCrawler } from "./nudge/NudgeCrawler.js";

function toMins(item: UnifiedItem): number {
  if (item.kind === "calendar") {
    const d = new Date(item.data.start);
    return d.getHours() * 60 + d.getMinutes();
  }
  if (!item.data.time) return Infinity;
  const [h, m] = item.data.time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [clockTime, setClockTime] = useState<string>(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [timelyTasks, setTimelyTasks] = useState<TimelyTask[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const isToday = selectedDate.getTime() === todayMidnight.getTime();
  const isPast = selectedDate < todayMidnight;
  const dateStr = localDateStr(selectedDate);

  const sectionLabel = isToday
    ? "TODAY"
    : selectedDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();

  const pending = tasks.filter((t) => !t.completed).length;

  const unified: UnifiedItem[] = [
    ...tasks.map((t) => ({ kind: "task" as const, data: t })),
    ...calEvents.map((e) => ({ kind: "calendar" as const, data: e })),
  ].sort((a, b) => {
    if (a.kind === "calendar" && a.data.allDay) return -1;
    if (b.kind === "calendar" && b.data.allDay) return 1;
    return toMins(a) - toMins(b);
  });

  function goDay(delta: number) {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  }

  function goToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  }

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClockTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`);
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([fetchCalendarEvents(dateStr), fetchTasks(dateStr)]).then(([events, fetched]) => {
      setCalEvents(events);
      setTasks(fetched);
    });
  }, [dateStr]);

  useEffect(() => {
    fetchTimely().then(setTimelyTasks);
    fetchNudges().then(setNudges);
  }, []);

  async function handleAddTask(title: string, time?: string, notes?: string) {
    const result = await createTask(title, dateStr, (time || notes) ? { time, notes } : undefined);
    if (result) setTasks((prev) => [...prev, result]);
  }

  async function handleAddTimely(data: Omit<TimelyTask, "id" | "createdAt">) {
    const result = await createTimely(data);
    if (result) setTimelyTasks((prev) => [...prev, result]);
  }

  async function handleUpdateTimely(id: string, data: Partial<Omit<TimelyTask, "id" | "createdAt">>) {
    await updateTimely(id, data);
    setTimelyTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
  }

  async function handleDeleteTimely(id: string) {
    await deleteTimely(id);
    setTimelyTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      <div className="mz-flex-row" style={{ flex: 1, overflow: "hidden" }}>
        <main style={{ flex: 1, overflow: "hidden auto", padding: "36px 48px" }}>
          <DashboardMasthead
            date={selectedDate}
            isToday={isToday}
            clockTime={clockTime}
            onPrev={() => goDay(-1)}
            onNext={() => goDay(1)}
            onToday={goToday}
          />
          <DashboardSectionFlag label={sectionLabel} pending={pending} />
          <div className="mz-flex-col">
            {unified.length === 0 ? (
              <Text size="sm" attention="ambient">
                {isPast ? "No tasks recorded." : "No tasks yet."}
              </Text>
            ) : (
              unified.map((item, i) => (
                <UnifiedRow
                  key={item.kind === "task" ? item.data.id : `cal-${i}`}
                  item={item}
                  onComplete={(id) => setTasks((prev) => prev.map((x) => x.id === id ? { ...x, completed: true } : x))}
                  onNotesChange={(id, notes) => setTasks((prev) => prev.map((x) => x.id === id ? { ...x, notes } : x))}
                  onUpdate={(id, data) => setTasks((prev) => prev.map((x) => x.id === id ? { ...x, ...data, time: data.time ?? null } : x))}
                />
              ))
            )}
            {!isPast && <AddTaskRow onAdd={handleAddTask} />}
          </div>
        </main>

        <DashboardTimelyPanel
          tasks={timelyTasks}
          onAdd={handleAddTimely}
          onUpdate={handleUpdateTimely}
          onDelete={handleDeleteTimely}
        />
      </div>

      <NudgeCrawler nudges={nudges} />
    </div>
  );
}
