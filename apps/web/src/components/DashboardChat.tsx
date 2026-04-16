import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Text } from "@mzwxl/ui";
import { streamChat, type Message } from "../lib/chat.js";
import { getActiveSkillIds, subscribeSkillIds } from "../lib/skillStore.js";
const COLLAPSED_HEIGHT = 44;
const EXPANDED_HEIGHT = 340;

export function DashboardChat() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSkillIds, setLocalActiveSkillIds] = useState<Set<string>>(getActiveSkillIds);

  useEffect(() => subscribeSkillIds(setLocalActiveSkillIds), []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  function handleExpand() {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...nextMessages, assistantMsg]);

    await streamChat(
      [...activeSkillIds],
      nextMessages,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      },
      () => setStreaming(false),
      (msg) => {
        setError(msg);
        setStreaming(false);
        setMessages((prev) =>
          prev[prev.length - 1].content === "" ? prev.slice(0, -1) : prev
        );
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className="mz-flex-col"
      style={{
        borderTop: "var(--rule-weight) solid var(--border)",
        transition: "height 0.2s ease",
        height: expanded ? `${EXPANDED_HEIGHT}px` : `${COLLAPSED_HEIGHT}px`,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Header bar */}
      <div
        className="mz-flex-row"
        style={{
          height: `${COLLAPSED_HEIGHT}px`,
          flexShrink: 0,
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: expanded ? "default" : "pointer",
        }}
        onClick={!expanded ? handleExpand : undefined}
      >
        <Text size="xs" attention="ambient" as="span" style={{ letterSpacing: "0.04em" }}>
          Ask Claude
        </Text>
        <button
          aria-label="Open full Skills page"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/skills", { state: { messages } });
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            padding: "4px 6px",
            lineHeight: 1,
          }}
        >
          Skills →
        </button>
        <button
          aria-label={expanded ? "Minimise chat" : "Open chat"}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "0.7rem",
            padding: "4px",
            lineHeight: 1,
            transition: "transform 0.15s",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        >
          ▾
        </button>
      </div>

      {/* Messages */}
      <div
        className="mz-flex-col"
        style={{ flex: 1, overflowY: "auto", padding: "0 12px 8px", gap: "8px" }}
      >
        {messages.length === 0 && (
          <Text size="sm" attention="ambient" style={{ paddingTop: "4px" }}>
            What do you need today?
          </Text>
        )}
        {messages.map((msg, i) => (
          <Text
            key={i}
            as="div"
            size="sm"
            attention={msg.role === "user" ? "default" : "notable"}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "var(--accent-dim)" : "var(--bg-surface)",
              borderRadius: "8px",
              padding: "6px 10px",
              maxWidth: "90%",
              whiteSpace: "pre-wrap",
              lineHeight: 1.55,
            }}
          >
            {msg.content}
            {msg.role === "assistant" && streaming && i === messages.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "0.85em",
                  background: "var(--accent)",
                  marginLeft: "2px",
                  verticalAlign: "text-bottom",
                  animation: "mzwxl-pulse-border 0.8s ease infinite",
                  borderRadius: "1px",
                }}
              />
            )}
          </Text>
        ))}
        {error && (
          <Text size="xs" attention="urgent">{error}</Text>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="mz-flex-row"
        style={{
          flexShrink: 0,
          padding: "8px 12px",
          gap: "6px",
          alignItems: "flex-end",
          borderTop: "1px solid var(--border)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          disabled={streaming}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "6px 8px",
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            background: "var(--bg-surface)",
            color: "var(--text)",
            outline: "none",
            lineHeight: 1.4,
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "0.75rem",
            fontFamily: "var(--font-body)",
            cursor: !input.trim() || streaming ? "default" : "pointer",
            opacity: !input.trim() || streaming ? 0.4 : 1,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
