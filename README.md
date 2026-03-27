# MZWXL Productivity

Personal productivity app — calendar, tasks, day planning, timers, notes — with Claude AI built in via MCP.

## Setup

```bash
# 1. Enable pnpm (once per machine)
corepack enable pnpm

# 2. Install dependencies
pnpm install

# 3. Start dev server
pnpm dev
```

Open `http://localhost:5173` — you'll land on the Skills Browser.

## Architecture

```
MZWXL-productivity/
├── apps/
│   └── web/              # React + TypeScript frontend
├── packages/
│   ├── skills/           # Claude skill definitions
│   ├── ui/               # Design system
│   └── tsconfig/         # Shared TypeScript configs
├── CLAUDE.md             # Context for Claude Code sessions
├── turbo.json
└── pnpm-workspace.yaml
```

**AI backend:** Claude Code via MCP — no Anthropic API key required in the app. AI usage is covered by Claude Pro.

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | Repository foundation, skills browser |
| 2 | — | MCP server + live Claude in browser |
| 3 | — | Full design system |
| 4 | — | Google Calendar integration |
| 5 | — | Tasks with scheduling |
| 6 | — | Day planning, timers, notes |

## Requirements

- Node 22.x
- pnpm 9+
# MZWXL-productivity
