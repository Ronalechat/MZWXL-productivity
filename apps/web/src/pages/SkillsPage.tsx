import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ALL_SKILLS, getSkill } from "@mzwxl/skills";
import type { Skill } from "@mzwxl/skills";

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
          ? isBuiltin
            ? "var(--color-builtin-dim)"
            : "var(--color-accent-dim)"
          : "var(--color-paper-raised)",
        borderColor: isSelected
          ? isBuiltin
            ? "var(--color-builtin)"
            : "var(--color-accent)"
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
            background: isBuiltin
              ? "var(--color-builtin-dim)"
              : "var(--color-accent-dim)",
            color: isBuiltin ? "var(--color-builtin)" : "var(--color-accent)",
          }}
        >
          {isBuiltin ? "built-in" : "file"}
        </span>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: "var(--color-muted)" }}
      >
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

function SkillDetail({ skill }: { skill: Skill }) {
  const [copied, setCopied] = useState(false);
  const isBuiltin = skill.source === "builtin";

  const handleCopy = () => {
    navigator.clipboard.writeText(skill.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 mb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 mb-1">
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
            {isBuiltin ? "Claude Code built-in" : "local skill file"}
          </span>
        </div>
        <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
          {skill.description}
        </p>
        <div className="flex items-center gap-3">
          <code
            className="text-sm px-2 py-1 rounded"
            style={{
              background: "var(--color-border)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-ink)",
            }}
          >
            {skill.invocation}
          </code>
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
            {CATEGORY_LABELS[skill.category]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-muted)" }}>
          System Prompt
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{
            background: copied ? "var(--color-accent-dim)" : "var(--color-border)",
            color: copied ? "var(--color-accent)" : "var(--color-muted)",
          }}
        >
          {copied ? "Copied!" : "Copy prompt"}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto rounded-lg p-4 text-sm leading-relaxed"
        style={{
          background: "var(--color-ink)",
          color: "#e8e4de",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {skill.content}
      </div>

      {isBuiltin && (
        <p
          className="mt-3 text-xs leading-relaxed"
          style={{ color: "var(--color-muted)" }}
        >
          This is a Claude Code built-in skill. Invoke it by typing{" "}
          <code
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {skill.invocation}
          </code>{" "}
          in a Claude Code session. In Phase 2, the MCP server will bridge
          built-in skills to this browser interface.
        </p>
      )}
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-paper)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h1
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            MZWXL
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Claude Skills Browser
          </p>
        </div>

        {/* Skill list */}
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

        {/* Phase indicator */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              Phase 1 — Foundation
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-border)" }}>
            MCP connection in Phase 2
          </p>
        </div>
      </aside>

      {/* Detail panel */}
      <main className="flex-1 overflow-hidden px-8 py-6">
        {selectedSkill ? (
          <SkillDetail skill={selectedSkill} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--color-muted)" }}>Select a skill</p>
          </div>
        )}
      </main>
    </div>
  );
}
