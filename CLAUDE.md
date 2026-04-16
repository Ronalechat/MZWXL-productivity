# MZWXL Productivity

Personal productivity app. Calendar, tasks, day planning, timers, notes — all powered by Claude via MCP.

## Architecture

**Monorepo:** Turborepo + pnpm workspaces

```
apps/
  web/          React + TypeScript frontend (Vite, Tailwind v4, React Router v7)
packages/
  skills/       Claude skill definitions — the source of truth for all skill content
  ui/           Design system (tokens + components — Phase 3)
  tsconfig/     Shared TypeScript configs
```

## AI Integration: MCP Approach

Claude Code is the AI backend. The browser does not call the Anthropic API directly.

- **Phase 1 (current):** Skills are static — browseable in the UI, no live AI calls
- **Phase 2:** `apps/mcp` — a Node MCP server Claude Code connects to, enabling real AI responses from the browser
- **Phone access:** Mac runs Claude Code + Cloudflare Tunnel; phone hits the same MCP server

This approach means AI usage is covered by the Claude Pro subscription — no separate API billing.

## Skills

All Claude skills live in `packages/skills/src/`. Two types:

| Type      | Source                                               | Location                                              |
| --------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `file`    | Local SKILL.md files copied from `~/.claude/skills/` | `packages/skills/src/definitions/`                    |
| `builtin` | Claude Code internal skills                          | `packages/skills/src/definitions/builtins.ts` (stubs) |

To add a new skill: create a file in `packages/skills/src/definitions/`, add it to `ALL_SKILLS` in `packages/skills/src/index.ts`.

## Phase Roadmap

- **Phase 1** ✅ Repository foundation — monorepo, skills browser, this file
- **Phase 2** MCP server + live Claude integration in browser
- **Phase 3** Design system — full token system, component library
- **Phase 4** Apple Calendar integration (read + write)
- **Phase 5** Tasks with scheduling and reminders
- **Phase 6** Day planning + AI, timers, notes

## Node / Package Manager

- Node: 22.22.1 (see `.nvmrc`)
- pnpm: 9.15.1 (enabled via `corepack enable pnpm`)

## Dev Commands

```bash
pnpm install      # install all packages
pnpm dev          # start all apps in dev mode
pnpm build        # build all packages
pnpm typecheck    # type-check all packages
```

## Rules for Claude Code Sessions

- **Never commit or push.** The user handles all git operations.
- Do not explore the project directory without being asked — ask about project state instead.
- When adding features, work one phase at a time and confirm before starting the next.

## React Standards

This project is a world-class design system. All React code must meet that bar.

- **Component decomposition** — Every logical UI section is its own component. A page file should be a composition of components, not a monolith. If you are writing JSX for a distinct UI element inside a larger file, extract it.
- **File size** — Observe at ~150 lines (flag opportunities to extract). Hard limit is ~400 lines — if a file exceeds that, stop and extract sub-components before continuing.
- **Co-location** — Each component lives in its own file. Related sub-components live in a folder alongside the parent (e.g. `Dashboard/DashboardPage.tsx`, `Dashboard/DateMasthead.tsx`, `Dashboard/UnifiedRow.tsx`).
- **Sub-component suggestion** — When a feature requires new UI, proactively suggest the component breakdown before writing code. Do not bundle new UI into an existing large file.
- **Single responsibility** — Each component does one thing. Data fetching, layout, and rendering should not all live in the same component.
- **Always use React best practices** — proper use of hooks, stable keys, cleanup in useEffect, no functions defined inside JSX, no index keys on dynamic lists.
- **DashboardPage.tsx is a known violation** — it must be broken down as part of the CSS reorganisation task. Do not add any further code to it without extracting first.
