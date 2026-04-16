import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { spawn } from "node:child_process";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import ical from "node-ical";
import { getSkill } from "@mzwxl/skills";

const PORT = 3001;

// ---- Task file store -------------------------------------------------

const TASKS_DIR = join(homedir(), ".mzwxl");
const TASKS_FILE = join(TASKS_DIR, "tasks.json");

interface TaskRow {
  id: string;
  title: string;
  time: string | null; // "HH:MM" 24h
  date: string;        // "YYYY-MM-DD"
  completed: boolean;
  notes: string;
}

async function readTasks(): Promise<TaskRow[]> {
  try {
    return JSON.parse(await readFile(TASKS_FILE, "utf8")) as TaskRow[];
  } catch {
    return [];
  }
}

async function writeTasks(tasks: TaskRow[]): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
  await writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

function runJxa(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("osascript", ["-l", "JavaScript"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`osascript exited ${code}: ${stderr.trim()}`));
      else resolve(stdout.trim());
    });
    proc.stdin.write(script);
    proc.stdin.end();
  });
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  skillIds: string[];
  messages: Message[];
}

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/health", (c) => c.json({ ok: true, port: PORT }));

app.post("/api/chat", async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { skillIds, messages } = body;

  const skills = skillIds.map((id) => getSkill(id)).filter((s) => s !== undefined);
  if (skills.length === 0) {
    return c.json({ error: `No valid skills: ${skillIds.join(", ")}` }, 400);
  }

  const systemPrompt = skills.length === 1
    ? skills[0].content
    : skills.map((s) => `# ${s.name}\n\n${s.content}`).join("\n\n---\n\n");

  // Format conversation history into a single prompt.
  // claude --print is single-turn, so we inline prior turns.
  const history = messages.slice(0, -1);
  const latest = messages[messages.length - 1];

  if (!latest || latest.role !== "user") {
    return c.json({ error: "Last message must be from user" }, 400);
  }

  let prompt = latest.content;
  if (history.length > 0) {
    const formatted = history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
    prompt = `Previous conversation:\n${formatted}\n\nUser: ${latest.content}`;
  }

  return streamSSE(c, async (stream) => {
    await new Promise<void>((resolve) => {
      const proc = spawn("claude", [
        "--print",
        "--system-prompt",
        systemPrompt,
        "--output-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--dangerously-skip-permissions",
        prompt,
      ], { stdio: ["ignore", "pipe", "pipe"] });

      // Kill the claude process if the client disconnects mid-stream.
      c.req.raw.signal.addEventListener("abort", () => proc.kill());

      // Buffer stdout to handle JSON lines that span multiple data chunks.
      let lineBuffer = "";
      // Track how much text we've already sent to extract deltas from cumulative snapshots.
      let lastTextLength = 0;

      proc.stdout.on("data", (chunk: Buffer) => {
        lineBuffer += chunk.toString();
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines.filter(Boolean)) {
          try {
            const event = JSON.parse(line) as Record<string, unknown>;
            // assistant event: { type: "assistant", message: { content: [{ type: "text", text: "..." }] } }
            // With --include-partial-messages, text contains the full accumulated text so far (not a delta).
            if (event.type === "assistant") {
              const message = event.message as { content?: { type: string; text?: string }[] } | undefined;
              const textBlock = message?.content?.find((b) => b.type === "text");
              if (textBlock?.text) {
                const delta = textBlock.text.slice(lastTextLength);
                lastTextLength = textBlock.text.length;
                if (delta) {
                  stream.writeSSE({ data: JSON.stringify({ type: "text", text: delta }) });
                }
              }
            }
            // result event signals completion
            if (event.type === "result") {
              stream.writeSSE({ data: JSON.stringify({ type: "done" }) });
            }
          } catch {
            // ignore non-JSON lines
          }
        }
      });

      // Buffer stderr — only surface it as an error if the process exits non-zero.
      // Claude CLI writes non-error progress info to stderr during normal operation.
      let stderrBuf = "";
      proc.stderr.on("data", (chunk: Buffer) => {
        stderrBuf += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0 && stderrBuf) {
          stream.writeSSE({ data: JSON.stringify({ type: "error", text: stderrBuf }) });
        }
        stream.writeSSE({ data: JSON.stringify({ type: "done" }) });
        resolve();
      });
    });
  });
});

// ---- POST /api/calendar — create event ----------------------------------------

app.post("/api/calendar", async (c) => {
  const { title, start, end, notes } = await c.req.json<{
    title: string; start: string; end: string; notes?: string;
  }>();
  if (!title || !start || !end) return c.json({ error: "title, start, end required" }, 400);
  const script = `
    function run() {
      const app = Application('Calendar');
      const cal = app.defaultCalendar();
      const event = app.Event({
        summary: ${JSON.stringify(title)},
        startDate: new Date(${JSON.stringify(start)}),
        endDate: new Date(${JSON.stringify(end)})${notes ? `,\n        description: ${JSON.stringify(notes)}` : ""}
      });
      cal.events.push(event);
      return JSON.stringify({ uid: event.uid() });
    }
  `;
  try {
    return c.json(JSON.parse(await runJxa(script)));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ---- Reminders ----------------------------------------------------------------

interface ReminderRow {
  id: string; title: string; completed: boolean;
  dueDate: string | null; completionDate: string | null; notes: string;
}

const FETCH_REMINDERS_JXA = `
function run() {
  const app = Application('Reminders');
  const lists = app.lists();
  let list = lists.find(l => l.name() === 'MZWXL');
  if (!list) { list = app.List({ name: 'MZWXL' }); app.lists.push(list); }
  return JSON.stringify(list.reminders().map(r => ({
    id: r.id(),
    title: r.name(),
    completed: r.completed(),
    dueDate: r.dueDate() ? r.dueDate().toISOString() : null,
    completionDate: r.completionDate() ? r.completionDate().toISOString() : null,
    notes: r.body() || ''
  })));
}
`;

app.get("/api/reminders", async (c) => {
  const dateParam = c.req.query("date");
  const base = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const isToday = dayStart.getTime() === todayStart.getTime();
  const isPast = dayStart < todayStart;

  try {
    const all = JSON.parse(await runJxa(FETCH_REMINDERS_JXA)) as ReminderRow[];
    const reminders = all.filter((r) => {
      const due = r.dueDate ? new Date(r.dueDate) : null;
      const comp = r.completionDate ? new Date(r.completionDate) : null;
      if (isPast) {
        if (r.completed && comp && comp >= dayStart && comp < dayEnd) return true;
        if (!r.completed && due && due >= dayStart && due < dayEnd) return true;
        return false;
      }
      if (isToday) {
        if (!r.completed && !due) return true;
        if (due && due >= dayStart && due < dayEnd) return true;
        return false;
      }
      return !!(due && due >= dayStart && due < dayEnd);
    });
    return c.json({ reminders });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/api/reminders", async (c) => {
  const { title, dueDate, notes } = await c.req.json<{
    title: string; dueDate?: string; notes?: string;
  }>();
  if (!title) return c.json({ error: "title required" }, 400);
  const propsLines = [`name: ${JSON.stringify(title)}`];
  if (dueDate) propsLines.push(`dueDate: new Date(${JSON.stringify(dueDate)})`);
  if (notes) propsLines.push(`body: ${JSON.stringify(notes)}`);
  const script = `
    function run() {
      const app = Application('Reminders');
      const lists = app.lists();
      let list = lists.find(l => l.name() === 'MZWXL');
      if (!list) { list = app.List({ name: 'MZWXL' }); app.lists.push(list); }
      const reminder = app.Reminder({ ${propsLines.join(", ")} });
      list.reminders.push(reminder);
      return JSON.stringify({ id: reminder.id(), title: reminder.name() });
    }
  `;
  try {
    return c.json(JSON.parse(await runJxa(script)));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.patch("/api/reminders", async (c) => {
  const { id, completed, title, dueDate } = await c.req.json<{
    id: string; completed?: boolean; title?: string; dueDate?: string | null;
  }>();
  if (!id) return c.json({ error: "id required" }, 400);
  const updates: string[] = [];
  if (completed !== undefined) updates.push(`reminder.completed = ${completed};`);
  if (title !== undefined) updates.push(`reminder.name = ${JSON.stringify(title)};`);
  if (dueDate !== undefined) updates.push(dueDate
    ? `reminder.dueDate = new Date(${JSON.stringify(dueDate)});`
    : `reminder.dueDate = null;`);
  const script = `
    function run() {
      const app = Application('Reminders');
      const mzwxl = app.lists().find(l => l.name() === 'MZWXL');
      if (!mzwxl) return JSON.stringify({ ok: false, error: 'list not found' });
      const reminder = mzwxl.reminders().find(r => r.id() === ${JSON.stringify(id)});
      if (!reminder) return JSON.stringify({ ok: false, error: 'not found' });
      ${updates.join("\n      ")}
      return JSON.stringify({ ok: true });
    }
  `;
  try {
    const result = JSON.parse(await runJxa(script)) as { ok: boolean; error?: string };
    return c.json(result, result.ok ? 200 : 404);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.delete("/api/reminders", async (c) => {
  const { id } = await c.req.json<{ id: string }>();
  if (!id) return c.json({ error: "id required" }, 400);
  const script = `
    function run() {
      const app = Application('Reminders');
      const mzwxl = app.lists().find(l => l.name() === 'MZWXL');
      if (!mzwxl) return JSON.stringify({ ok: false });
      const reminder = mzwxl.reminders().find(r => r.id() === ${JSON.stringify(id)});
      if (!reminder) return JSON.stringify({ ok: false });
      app.delete(reminder);
      return JSON.stringify({ ok: true });
    }
  `;
  try {
    return c.json(JSON.parse(await runJxa(script)));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ---- Timely file store -------------------------------------------------------

const TIMELY_FILE = join(TASKS_DIR, "timely.json");

interface TimelyRow {
  id: string;
  title: string;
  reason: string;
  details?: string;
  image?: string;
  dateRange?: { from?: string; to?: string };
  createdAt: string;
}

const TIMELY_SEED: TimelyRow[] = [
  { id: "t1", title: "Catfood being discontinued", reason: "Buy as many cans as you can before stock runs out", createdAt: new Date().toISOString() },
  { id: "t2", title: "Submit tax return", reason: "Penalty applies after the due date — don't leave it", dateRange: { to: "2026-10-31" }, createdAt: new Date().toISOString() },
  { id: "t3", title: "Book dentist appointment", reason: "It has been over a year — book before the end of the month", dateRange: { to: "2026-03-31" }, createdAt: new Date().toISOString() },
];

async function readTimely(): Promise<TimelyRow[]> {
  try {
    const rows = JSON.parse(await readFile(TIMELY_FILE, "utf8")) as TimelyRow[];
    if (rows.length === 0) return TIMELY_SEED;
    return rows;
  } catch {
    return TIMELY_SEED;
  }
}

async function writeTimely(rows: TimelyRow[]): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
  await writeFile(TIMELY_FILE, JSON.stringify(rows, null, 2), "utf8");
}

// ---- Nudge file store --------------------------------------------------------

const NUDGES_FILE = join(TASKS_DIR, "nudges.json");

interface NudgeRow {
  id: string;
  text: string;
}

async function readNudges(): Promise<NudgeRow[]> {
  try {
    return JSON.parse(await readFile(NUDGES_FILE, "utf8")) as NudgeRow[];
  } catch {
    return [];
  }
}

async function writeNudges(rows: NudgeRow[]): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
  await writeFile(NUDGES_FILE, JSON.stringify(rows, null, 2), "utf8");
}

// ---- Tasks -------------------------------------------------------------------

app.get("/api/tasks", async (c) => {
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date required" }, 400);
  const tasks = await readTasks();
  return c.json({ tasks: tasks.filter((t) => t.date === date) });
});

app.post("/api/tasks", async (c) => {
  const { title, date, time, notes } = await c.req.json<{
    title: string; date: string; time?: string; notes?: string;
  }>();
  if (!title || !date) return c.json({ error: "title and date required" }, 400);
  const task: TaskRow = {
    id: crypto.randomUUID(),
    title,
    time: time ?? null,
    date,
    completed: false,
    notes: notes ?? "",
  };
  const tasks = await readTasks();
  tasks.push(task);
  await writeTasks(tasks);
  return c.json(task, 201);
});

app.patch("/api/tasks", async (c) => {
  const { id, completed, title, time, notes } = await c.req.json<{
    id: string; completed?: boolean; title?: string; time?: string | null; notes?: string;
  }>();
  if (!id) return c.json({ error: "id required" }, 400);
  const tasks = await readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return c.json({ error: "not found" }, 404);
  if (completed !== undefined) tasks[idx].completed = completed;
  if (title !== undefined) tasks[idx].title = title;
  if (time !== undefined) tasks[idx].time = time;
  if (notes !== undefined) tasks[idx].notes = notes;
  await writeTasks(tasks);
  return c.json(tasks[idx]);
});

app.delete("/api/tasks", async (c) => {
  const { id } = await c.req.json<{ id: string }>();
  if (!id) return c.json({ error: "id required" }, 400);
  const next = (await readTasks()).filter((t) => t.id !== id);
  await writeTasks(next);
  return c.json({ ok: true });
});

// ---- Timely endpoints --------------------------------------------------------

app.get("/api/timely", async (c) => {
  return c.json({ timely: await readTimely() });
});

app.post("/api/timely", async (c) => {
  const { title, reason, details, image, dateRange } = await c.req.json<Omit<TimelyRow, "id" | "createdAt">>();
  if (!title || !reason) return c.json({ error: "title and reason required" }, 400);
  const row: TimelyRow = {
    id: crypto.randomUUID(),
    title, reason,
    ...(details !== undefined && { details }),
    ...(image !== undefined && { image }),
    ...(dateRange !== undefined && { dateRange }),
    createdAt: new Date().toISOString(),
  };
  const rows = await readTimely();
  rows.push(row);
  await writeTimely(rows);
  return c.json(row, 201);
});

app.patch("/api/timely", async (c) => {
  const { id, title, reason, details, image, dateRange } = await c.req.json<Partial<TimelyRow> & { id: string }>();
  if (!id) return c.json({ error: "id required" }, 400);
  const rows = await readTimely();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ error: "not found" }, 404);
  if (title !== undefined) rows[idx].title = title;
  if (reason !== undefined) rows[idx].reason = reason;
  if (details !== undefined) rows[idx].details = details;
  if (image !== undefined) rows[idx].image = image;
  if (dateRange !== undefined) rows[idx].dateRange = dateRange;
  await writeTimely(rows);
  return c.json(rows[idx]);
});

app.delete("/api/timely", async (c) => {
  const { id } = await c.req.json<{ id: string }>();
  if (!id) return c.json({ error: "id required" }, 400);
  await writeTimely((await readTimely()).filter((r) => r.id !== id));
  return c.json({ ok: true });
});

// ---- Nudge endpoints ---------------------------------------------------------

app.get("/api/nudges", async (c) => {
  return c.json({ nudges: await readNudges() });
});

app.post("/api/nudges", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text) return c.json({ error: "text required" }, 400);
  const row: NudgeRow = { id: crypto.randomUUID(), text };
  const rows = await readNudges();
  rows.push(row);
  await writeNudges(rows);
  return c.json(row, 201);
});

app.patch("/api/nudges", async (c) => {
  const { id, text } = await c.req.json<{ id: string; text: string }>();
  if (!id || !text) return c.json({ error: "id and text required" }, 400);
  const rows = await readNudges();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ error: "not found" }, 404);
  rows[idx].text = text;
  await writeNudges(rows);
  return c.json(rows[idx]);
});

app.delete("/api/nudges", async (c) => {
  const { id } = await c.req.json<{ id: string }>();
  if (!id) return c.json({ error: "id required" }, 400);
  await writeNudges((await readNudges()).filter((r) => r.id !== id));
  return c.json({ ok: true });
});

// ---- Calendar helpers --------------------------------------------------------

type CalEventResult = {
  title: string; start: string; end: string; allDay: boolean;
  description?: string; location?: string; url?: string;
};

async function scanCalendarEvents(rangeStart: Date, rangeEnd: Date): Promise<CalEventResult[]> {
  const calRoot = join(homedir(), "Library", "Calendars");
  const events: CalEventResult[] = [];

  async function scanDir(dir: string) {
    let entries: string[];
    try { entries = await readdir(dir); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === "Events") {
        let icsFiles: string[];
        try { icsFiles = (await readdir(full)).filter((f) => f.endsWith(".ics")); } catch { continue; }
        for (const file of icsFiles) {
          try {
            const raw = await readFile(join(full, file), "utf8");
            const parsed = ical.parseICS(raw);
            for (const comp of Object.values(parsed)) {
              if (!comp || comp.type !== "VEVENT") continue;
              const ev = comp as ical.VEvent;
              const start = ev.start instanceof Date ? ev.start : new Date((ev.start ?? "") as string);
              const end = ev.end instanceof Date ? ev.end : new Date((ev.end ?? "") as string);
              if (isNaN(start.getTime())) continue;
              const eventEnd = isNaN(end.getTime()) ? start : end;
              if (start < rangeEnd && eventEnd > rangeStart) {
                const allDay = (ev as unknown as { datetype?: string }).datetype === "date";
                const rawSummary = ev.summary as unknown;
                const title = typeof rawSummary === "string" ? rawSummary : (rawSummary as { val?: string })?.val ?? "(No title)";
                const rawDesc = ev.description as unknown;
                const description = typeof rawDesc === "string" && rawDesc.trim() ? rawDesc.trim() : (rawDesc as { val?: string })?.val?.trim() || undefined;
                const rawLoc = ev.location as unknown;
                const location = typeof rawLoc === "string" && rawLoc.trim() ? rawLoc.trim() : (rawLoc as { val?: string })?.val?.trim() || undefined;
                const rawUrl = (ev as unknown as { url?: unknown }).url;
                const url = typeof rawUrl === "string" && rawUrl.trim() ? rawUrl.trim() : (rawUrl as { val?: string })?.val?.trim() || undefined;
                events.push({ title, start: start.toISOString(), end: eventEnd.toISOString(), allDay, description, location, url });
              }
            }
          } catch { /* skip unreadable/malformed ICS */ }
        }
      } else if (entry.endsWith(".calendar") || entry.endsWith(".caldav")) {
        await scanDir(full);
      }
    }
  }

  await scanDir(calRoot);
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return events;
}

// ---- GET /api/calendar --------------------------------------------------------

app.get("/api/calendar", async (c) => {
  const dateParam = c.req.query("date");
  const base = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const events = await scanCalendarEvents(dayStart, dayEnd);
  return c.json({ events, date: dayStart.toISOString() });
});

// ---- GET /api/calendar/range --------------------------------------------------

app.get("/api/calendar/range", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!from || !to) return c.json({ events: [] });
  const rangeStart = new Date(`${from}T00:00:00`);
  const rangeEnd = new Date(`${to}T23:59:59`);
  const events = await scanCalendarEvents(rangeStart, rangeEnd);
  return c.json({ events });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
});
