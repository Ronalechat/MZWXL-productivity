const MCP_URL = "http://localhost:3001";

export interface TimelyTask {
  id: string;
  title: string;
  reason: string;
  details?: string;
  image?: string;
  dateRange?: { from?: string; to?: string };
  createdAt: string;
}

export interface Nudge {
  id: string;
  text: string;
}

export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  location?: string;
  url?: string;
}

export interface Task {
  id: string;
  title: string;
  time: string | null; // "HH:MM" 24h
  date: string;        // "YYYY-MM-DD"
  completed: boolean;
  notes: string;
}

export type Category = "work" | "health" | "social" | "personal" | "admin";

export const CATEGORY_COLORS: Record<Category, string> = {
  work:     "var(--cat-work)",
  health:   "var(--cat-health)",
  social:   "var(--cat-social)",
  personal: "var(--cat-personal)",
  admin:    "var(--cat-admin)",
};

export function inferCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/gym|workout|run|walk|swim|yoga|exercise|health|doctor|dentist|physio/.test(t)) return "health";
  if (/meeting|standup|stand-up|call|sync|review|interview|work|project|sprint/.test(t)) return "work";
  if (/lunch|dinner|coffee|drinks|party|friend|family|social|date/.test(t)) return "social";
  if (/invoice|tax|bill|admin|bank|insurance|form|errand/.test(t)) return "admin";
  return "personal";
}

export async function fetchCalendarEvents(date: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(`${MCP_URL}/api/calendar?date=${date}`);
    if (!res.ok) return [];
    return (await res.json() as { events: CalendarEvent[] }).events;
  } catch {
    return [];
  }
}

export async function fetchCalendarRange(from: string, to: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(`${MCP_URL}/api/calendar/range?from=${from}&to=${to}`);
    if (!res.ok) return [];
    return (await res.json() as { events: CalendarEvent[] }).events;
  } catch {
    return [];
  }
}

export async function fetchTasks(date: string): Promise<Task[]> {
  try {
    const res = await fetch(`${MCP_URL}/api/tasks?date=${date}`);
    if (!res.ok) return [];
    return (await res.json() as { tasks: Task[] }).tasks;
  } catch {
    return [];
  }
}

export async function createTask(
  title: string,
  date: string,
  opts?: { time?: string; notes?: string }
): Promise<Task | null> {
  try {
    const res = await fetch(`${MCP_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, ...opts }),
    });
    return res.ok ? (await res.json() as Task) : null;
  } catch {
    return null;
  }
}

export async function completeTask(id: string): Promise<void> {
  await fetch(`${MCP_URL}/api/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, completed: true }),
  });
}

export async function updateTask(id: string, data: { title?: string; time?: string | null }): Promise<void> {
  await fetch(`${MCP_URL}/api/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
}

export async function updateTaskNotes(id: string, notes: string): Promise<void> {
  await fetch(`${MCP_URL}/api/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, notes }),
  });
}

// ---- Timely ------------------------------------------------------------------

export async function fetchTimely(): Promise<TimelyTask[]> {
  try {
    const res = await fetch(`${MCP_URL}/api/timely`);
    if (!res.ok) return [];
    return (await res.json() as { timely: TimelyTask[] }).timely;
  } catch { return []; }
}

export async function createTimely(data: Omit<TimelyTask, "id" | "createdAt">): Promise<TimelyTask | null> {
  try {
    const res = await fetch(`${MCP_URL}/api/timely`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok ? (await res.json() as TimelyTask) : null;
  } catch { return null; }
}

export async function updateTimely(id: string, data: Partial<Omit<TimelyTask, "id" | "createdAt">>): Promise<void> {
  await fetch(`${MCP_URL}/api/timely`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteTimely(id: string): Promise<void> {
  await fetch(`${MCP_URL}/api/timely`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

// ---- Nudges ------------------------------------------------------------------

export async function fetchNudges(): Promise<Nudge[]> {
  try {
    const res = await fetch(`${MCP_URL}/api/nudges`);
    if (!res.ok) return [];
    return (await res.json() as { nudges: Nudge[] }).nudges;
  } catch { return []; }
}

export async function createNudge(text: string): Promise<Nudge | null> {
  try {
    const res = await fetch(`${MCP_URL}/api/nudges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok ? (await res.json() as Nudge) : null;
  } catch { return null; }
}

export async function updateNudge(id: string, text: string): Promise<void> {
  await fetch(`${MCP_URL}/api/nudges`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, text }),
  });
}

export async function deleteNudge(id: string): Promise<void> {
  await fetch(`${MCP_URL}/api/nudges`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await fetch(`${MCP_URL}/api/tasks`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
