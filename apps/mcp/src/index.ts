import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { spawn } from "node:child_process";
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

      proc.stdout.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const event = JSON.parse(line) as Record<string, unknown>;
            // assistant event: { type: "assistant", message: { content: [{ type: "text", text: "..." }] } }
            if (event.type === "assistant") {
              const message = event.message as { content?: { type: string; text?: string }[] } | undefined;
              const textBlock = message?.content?.find((b) => b.type === "text");
              if (textBlock?.text) {
                stream.writeSSE({ data: JSON.stringify({ type: "text", text: textBlock.text }) });
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

      proc.stderr.on("data", (chunk: Buffer) => {
        // surface stderr to the browser for debugging in dev
        stream.writeSSE({
          data: JSON.stringify({ type: "error", text: chunk.toString() }),
        });
      });

      proc.on("close", () => {
        stream.writeSSE({ data: JSON.stringify({ type: "done" }) });
        resolve();
      });
    });
  });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
});
