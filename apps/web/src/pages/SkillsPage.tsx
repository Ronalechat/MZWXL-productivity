import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router";
import { ALL_SKILLS, getSkill } from "@mzwxl/skills";
import { getActiveSkillIds, setActiveSkillIds, subscribeSkillIds } from "../lib/skillStore.js";
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
  isActive,
  onClick,
}: {
  skill: Skill;
  isActive: boolean;
  onClick: () => void;
}) {
  const isBuiltin = skill.source === "builtin";
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      style={{
        background: isActive
          ? isBuiltin ? "var(--color-builtin-dim)" : "var(--color-accent-dim)"
          : "transparent",
        borderRadius: 0,
        borderTop: "none",
        borderRight: "none",
        borderBottom: "1px solid var(--color-border)",
        borderLeft: isActive
          ? isBuiltin ? "3px solid var(--color-builtin)" : "3px solid var(--color-accent)"
          : "3px solid transparent",
        width: "100%",
        textAlign: "left",
        padding: "14px 16px 14px 13px",
        cursor: "pointer",
        transition: "background 0.12s, border-left-color 0.12s",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
          {isActive && (
            <span style={{
              fontSize: "0.5rem",
              color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
              flexShrink: 0,
              lineHeight: 1,
            }}>■</span>
          )}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
            }}
          >
            {skill.name}
          </span>
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            padding: "2px 6px",
            borderRadius: "2px",
            flexShrink: 0,
            background: isBuiltin ? "var(--color-builtin-dim)" : "var(--color-accent-dim)",
            color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
          }}
        >
          {isBuiltin ? "built-in" : "file"}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
        {skill.description}
      </p>
      <code
        style={{ marginTop: "6px", display: "block", fontSize: "0.65rem", letterSpacing: "0.04em", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}
      >
        {skill.invocation}
      </code>
    </button>
  );
}

function ChatPanel({ skills, initialMessages }: { skills: Skill[]; initialMessages?: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const primarySkill = skills[0];
  const isBuiltin = primarySkill?.source === "builtin";

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
      skills.map((s) => s.id),
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
      <div className="pb-4 mb-4 flex items-center gap-3" style={{ borderBottom: "3px solid var(--color-border)" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            {skills.length === 1 && primarySkill
              ? primarySkill.description
              : `${skills.length} skills active`}
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
              {skills.length === 1 && isBuiltin
                ? "This is a Claude Code built-in skill. Conversations are proxied through your local claude CLI."
                : skills.length > 1
                  ? `${skills.length} skill system prompts are active. Ask anything across their domains.`
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
                className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        borderRadius: "4px",
                        background: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
                        color: "white",
                      }
                    : {
                        borderRadius: "4px",
                        background: "var(--color-paper-raised)",
                        border: "2px solid var(--color-border)",
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
          className="flex-1 resize-none px-4 py-3 text-sm outline-none transition-colors"
          style={{
            borderRadius: "4px",
            background: "var(--color-paper-raised)",
            border: "2px solid var(--color-border)",
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
          className="px-4 py-3 text-sm font-medium transition-opacity"
          style={{
            borderRadius: "4px",
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
  const location = useLocation();
  const handoffMessages: Message[] | undefined = (location.state as { messages?: Message[] } | null)?.messages;

  const [activeSkillIds, setLocalActiveSkillIds] = useState<Set<string>>(getActiveSkillIds);

  useEffect(() => subscribeSkillIds(setLocalActiveSkillIds), []);

  function toggleSkill(skillId: string) {
    const prev = getActiveSkillIds();
    if (prev.has(skillId) && prev.size === 1) return; // keep at least one
    const next = new Set(prev);
    if (next.has(skillId)) next.delete(skillId);
    else next.add(skillId);
    setActiveSkillIds(next);
  }

  const activeSkills = ALL_SKILLS.filter((s) => activeSkillIds.has(s.id));
  const fileSkills = ALL_SKILLS.filter((s) => s.source === "file");
  const builtinSkills = ALL_SKILLS.filter((s) => s.source === "builtin");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-paper)" }}>
      {/* Sidebar */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "3px solid var(--color-border)" }}
      >
        <div style={{ padding: "24px 20px 20px", borderBottom: "3px solid var(--color-border)" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.88,
              color: "var(--color-ink)",
            }}
          >
            MZWXL
          </div>
          <div style={{
            fontSize: "0.65rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            marginTop: "10px",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "6px",
          }}>
            Skills
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col">
          <div>
            <p
              style={{
                fontSize: "0.7rem",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--color-muted)",
                padding: "12px 16px 8px",
              }}
            >
              Local ({fileSkills.length})
            </p>
            <div className="flex flex-col">
              {fileSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isActive={activeSkillIds.has(skill.id)}
                  onClick={() => toggleSkill(skill.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ height: "2px", background: "var(--color-border)", margin: "8px 16px" }} />

          <div>
            <p
              style={{
                fontSize: "0.7rem",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--color-muted)",
                padding: "12px 16px 8px",
              }}
            >
              Built-in ({builtinSkills.length})
            </p>
            <div className="flex flex-col">
              {builtinSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isActive={activeSkillIds.has(skill.id)}
                  onClick={() => toggleSkill(skill.id)}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="px-4 py-3" style={{ borderTop: "3px solid var(--color-border)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2" style={{ background: "var(--color-accent)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              Phase 2 — MCP Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex-1 overflow-hidden px-8 py-6">
        {activeSkills.length > 0 ? (
          <ChatPanel skills={activeSkills} initialMessages={handoffMessages} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--color-muted)" }}>Select a skill</p>
          </div>
        )}
      </main>
    </div>
  );
}
