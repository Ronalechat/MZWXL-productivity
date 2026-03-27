export type SkillSource = "file" | "builtin";

export type SkillCategory =
  | "context"
  | "frontend"
  | "workflow"
  | "development"
  | "configuration";

export interface Skill {
  /** Unique identifier, matches the slash command name */
  id: string;
  /** Human-readable display name */
  name: string;
  /** One-line description of when/why to use this skill */
  description: string;
  /** Full SKILL.md content used as the system prompt */
  content: string;
  /** Whether this skill comes from a local SKILL.md file or is a Claude Code built-in */
  source: SkillSource;
  /** Thematic category for grouping in the UI */
  category: SkillCategory;
  /** Slash command to invoke this skill in Claude Code */
  invocation: string;
}
