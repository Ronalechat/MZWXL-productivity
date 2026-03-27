import type { Skill } from "../types.js";

/**
 * Built-in Claude Code skills. These are not file-based — they are internal
 * to the Claude Code CLI. Content here documents their purpose so the browser
 * UI can describe and link to them. Invocation requires a running Claude Code session.
 */

export const updateConfig: Skill = {
  id: "update-config",
  name: "Update Config",
  description:
    "Configure Claude Code via settings.json. Set up automated hooks, permissions, env vars, and behavioral rules.",
  invocation: "/update-config",
  source: "builtin",
  category: "configuration",
  content: `# Update Config

Configures the Claude Code harness via settings.json.

Use this skill for:
- Automated behaviors ("from now on when X", "each time X", "whenever X")
- Permissions ("allow X", "add permission", "move permission to")
- Environment variables ("set X=Y")
- Hook troubleshooting
- Any changes to settings.json or settings.local.json

Note: Automated behaviors require hooks configured in settings.json — the harness executes these, not Claude, so memory/preferences cannot fulfill them.`,
};

export const keybindingsHelp: Skill = {
  id: "keybindings-help",
  name: "Keybindings Help",
  description:
    "Customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.claude/keybindings.json.",
  invocation: "/keybindings-help",
  source: "builtin",
  category: "configuration",
  content: `# Keybindings Help

Use when you want to:
- Customize keyboard shortcuts
- Rebind keys
- Add chord bindings
- Change the submit key
- Modify ~/.claude/keybindings.json`,
};

export const simplify: Skill = {
  id: "simplify",
  name: "Simplify",
  description:
    "Review changed code for reuse, quality, and efficiency, then fix any issues found.",
  invocation: "/simplify",
  source: "builtin",
  category: "development",
  content: `# Simplify

Reviews recently changed code for:
- Opportunities to reuse existing utilities
- Code quality improvements
- Efficiency improvements

Fixes any issues found in place.`,
};

export const loop: Skill = {
  id: "loop",
  name: "Loop",
  description:
    "Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo, defaults to 10m).",
  invocation: "/loop",
  source: "builtin",
  category: "workflow",
  content: `# Loop

Run a prompt or slash command on a recurring interval.

Usage: \`/loop [interval] [command]\`

Examples:
- \`/loop 5m /simplify\` — run /simplify every 5 minutes
- \`/loop 10m check the deploy status\` — check deploy every 10 minutes

Defaults to 10 minute intervals. Use for polling, recurring tasks, or automated checks.`,
};

export const schedule: Skill = {
  id: "schedule",
  name: "Schedule",
  description:
    "Create, update, list, or run scheduled remote agents that execute on a cron schedule.",
  invocation: "/schedule",
  source: "builtin",
  category: "workflow",
  content: `# Schedule

Create and manage scheduled remote agents (triggers) that execute on a cron schedule.

Use when you want to:
- Schedule a recurring remote agent
- Set up automated tasks
- Create a cron job for Claude Code
- Manage scheduled agents/triggers

Supports create, update, list, and run operations.`,
};

export const dashboardAssistant: Skill = {
  id: "dashboard-assistant",
  name: "Dashboard Assistant",
  description:
    "General productivity assistant available on the dashboard. Helps with day planning, task management, and quick questions.",
  invocation: "/dashboard-assistant",
  source: "builtin",
  category: "workflow",
  content: `You are a concise productivity assistant embedded in the MZWXL day planner.

The user is looking at their daily dashboard which shows today's tasks and timely/urgent reminders.

Your role:
- Help the user think through their day, prioritise tasks, and plan ahead
- Answer quick questions clearly and briefly
- Help draft or refine tasks and reminders
- Be direct — the user has ADHD and values clarity over elaboration

Keep responses short and scannable. Use bullet points where helpful. Avoid preamble.`,
};

export const claudeApi: Skill = {
  id: "claude-api",
  name: "Claude API",
  description:
    "Build apps with the Claude API or Anthropic SDK. Triggered when code imports anthropic or @anthropic-ai/sdk.",
  invocation: "/claude-api",
  source: "builtin",
  category: "development",
  content: `# Claude API

Build applications with the Claude API or Anthropic SDK.

Triggered when:
- Code imports \`anthropic\`, \`@anthropic-ai/sdk\`, or \`claude_agent_sdk\`
- User asks to use the Claude API or Anthropic SDKs
- User asks to use the Agent SDK

Covers: API usage, tool use, Anthropic SDK patterns, streaming, and agent construction.`,
};
