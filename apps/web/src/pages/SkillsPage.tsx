import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ALL_SKILLS, getSkill } from "@mzwxl/skills";
import type { Skill } from "@mzwxl/skills";
import { streamChat } from "../lib/chat.js";
import type { Message } from "../lib/chat.js";

const CATEGORY_LABELS: Record<Skill["category"], string> = {
  context: "Context",
  frontend: "Frontend",
  workflow: "Workflow",
  development: "Development",
  configuration: "Configuration",
};

function SkillCard({
  skill,
  isSelected,
  onClick,
}: {
  skill: Skill;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isBuiltin = skill.source === "builtin";
  return (
    <button
      onClick={onClick}
      style={{
        background: isSelected
          ? isBuiltin ? "var(--color-builtin-dim)" : "var(--color-accent-dim)"
          : "var(--color-paper-raised)",
        borderColor: isSelected
          ? isBuiltin ? "var(--color-builtin)" : "var(--color-accent)"
          : "var(--color-border)",
        borderWidth: isSelected ? "2px" : "1px",
      }}
      className="w-full text-left rounded-xl p-4 border transition-all duration-150 cursor-pointer hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className="text-sm font-semibold leading-snug"
          style={{
            fontFamily: "var(--font-display)",
            color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
          }}
        >
          {skill.name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            background: isBuiltin ? "var(--color-builtin-dim)" : "var(--color-accent-dim)",
            color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
          }}
        >
          {isBuiltin ? "built-in" : "file"}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
        {skill.description}
      </p>
      <code
        className="mt-2 block text-xs"
        style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}
      >
        {skill.invocation}
      </code>
    </button>
  );
}

function ChatPanel({ skill }: { skill: Skill }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBuiltin = skill.source === "builtin";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      skill.id,
      newMessages,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      },
      () => setStreaming(false),
      (msg) => {
        setError(msg);
        setStreaming(false);
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 mb-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
            >
              {skill.name}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: isBuiltin ? "var(--color-builtin-dim)" : "var(--color-accent-dim)",
                color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
              }}
            >
              {CATEGORY_LABELS[skill.category]}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            {skill.description}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto text-xs px-2 py-1 rounded"
            style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
            <p
              className="text-lg"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
            >
              Start a conversation
            </p>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {isBuiltin
                ? "This is a Claude Code built-in skill. Conversations are proxied through your local claude CLI."
                : "This skill's system prompt is active. Ask anything within its domain."}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
                        color: "white",
                      }
                    : {
                        background: "var(--color-paper-raised)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-ink)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }
                }
              >
                {msg.content || (streaming && i === messages.length - 1 ? (
                  <span style={{ color: "var(--color-muted)" }}>▋</span>
                ) : null)}
              </div>
            </div>
          ))
        )}
        {error && (
          <p className="text-xs text-center" style={{ color: "var(--color-accent)" }}>
            Error: {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="pt-3 flex gap-2 items-end"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask something… (Enter to send, Shift+Enter for newline)"
          disabled={streaming}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          style={{
            background: "var(--color-paper-raised)",
            border: "1px solid var(--color-border)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            maxHeight: "120px",
            overflowY: "auto",
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="rounded-xl px-4 py-3 text-sm font-medium transition-opacity"
          style={{
            background: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
            color: "white",
            opacity: !input.trim() || streaming ? 0.4 : 1,
          }}
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

export function SkillsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const selectedSkill = id ? getSkill(id) : ALL_SKILLS[0];

  const fileSkills = ALL_SKILLS.filter((s) => s.source === "file");
  const builtinSkills = ALL_SKILLS.filter((s) => s.source === "builtin");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-paper)" }}>
      {/* Sidebar */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h1
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            MZWXL
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Claude Skills
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest px-1 mb-2"
              style={{ color: "var(--color-muted)" }}
            >
              Local Skills ({fileSkills.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {fileSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSelected={selectedSkill?.id === skill.id}
                  onClick={() => navigate(`/skills/${skill.id}`)}
                />
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest px-1 mb-2"
              style={{ color: "var(--color-muted)" }}
            >
              Built-in Skills ({builtinSkills.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {builtinSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSelected={selectedSkill?.id === skill.id}
                  onClick={() => navigate(`/skills/${skill.id}`)}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-accent)" }} />
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              Phase 2 — MCP Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex-1 overflow-hidden px-8 py-6">
        {selectedSkill ? (
          <ChatPanel key={selectedSkill.id} skill={selectedSkill} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--color-muted)" }}>Select a skill</p>
          </div>
        )}
      </main>
    </div>
  );
}
