import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import ical from "node-ical";
import { getSkill } from "@mzwxl/skills";

const PORT = 3001;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  skillId: string;
  messages: Message[];
}

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/health", (c) => c.json({ ok: true, port: PORT }));

app.post("/api/chat", async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { skillId, messages } = body;

  const skill = getSkill(skillId);
  if (!skill) {
    return c.json({ error: `Unknown skill: ${skillId}` }, 400);
  }

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
        skill.content,
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

app.get("/api/calendar", async (c) => {
  const calRoot = join(homedir(), "Library", "Calendars");
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const events: { title: string; start: string; end: string; allDay: boolean }[] = [];

  async function scanDir(dir: string) {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === "Events") {
        // Parse all .ics files in this Events folder
        let icsFiles: string[];
        try {
          icsFiles = (await readdir(full)).filter((f) => f.endsWith(".ics"));
        } catch {
          continue;
        }
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
              // Check overlap with today
              const eventEnd = isNaN(end.getTime()) ? start : end;
              if (start < todayEnd && eventEnd > todayStart) {
                const allDay = (ev as unknown as { datetype?: string }).datetype === "date";
                const rawSummary = ev.summary as unknown;
                const title = typeof rawSummary === "string"
                  ? rawSummary
                  : (rawSummary as { val?: string })?.val ?? "(No title)";
                events.push({
                  title,
                  start: start.toISOString(),
                  end: eventEnd.toISOString(),
                  allDay,
                });
              }
            }
          } catch {
            // skip unreadable/malformed ICS
          }
        }
      } else if (entry.endsWith(".calendar") || entry.endsWith(".caldav")) {
        await scanDir(full);
      }
    }
  }

  await scanDir(calRoot);

  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return c.json({ events, date: todayStart.toISOString() });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
});
