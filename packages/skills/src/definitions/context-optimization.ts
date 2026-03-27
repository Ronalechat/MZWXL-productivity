import type { Skill } from "../types.js";

export const contextOptimization: Skill = {
  id: "context-optimization",
  name: "Context Optimization",
  description:
    'Optimize context windows: reduce token costs, improve efficiency, implement KV-cache optimization, observation masking, context budgeting, and partitioning.',
  invocation: "/context-optimization",
  source: "file",
  category: "context",
  content: `# Context Optimization Techniques

Context optimization extends the effective capacity of limited context windows through strategic compression, masking, caching, and partitioning. Effective optimization can double or triple effective context capacity without requiring larger models or longer windows — but only when applied with discipline. The techniques below are ordered by impact and risk.

## When to Activate

Activate this skill when:
- Context limits constrain task complexity
- Optimizing for cost reduction (fewer tokens = lower costs)
- Reducing latency for long conversations
- Implementing long-running agent systems
- Needing to handle larger documents or conversations
- Building production systems at scale

## Core Concepts

Apply four primary strategies in this priority order:

1. **KV-cache optimization** — Reorder and stabilize prompt structure so the inference engine reuses cached Key/Value tensors. This is the cheapest optimization: zero quality risk, immediate cost and latency savings. Apply it first and unconditionally.

2. **Observation masking** — Replace verbose tool outputs with compact references once their purpose has been served. Tool outputs consume 80%+ of tokens in typical agent trajectories, so masking them yields the largest capacity gains. The original content remains retrievable if needed downstream.

3. **Compaction** — Summarize accumulated context when utilization exceeds 70%, then reinitialize with the summary. This distills the window's contents while preserving task-critical state. Compaction is lossy — apply it after masking has already removed the low-value bulk.

4. **Context partitioning** — Split work across sub-agents with isolated contexts when a single window cannot hold the full problem. Each sub-agent operates in a clean context focused on its subtask. Reserve this for tasks where estimated context exceeds 60% of the window limit, because coordination overhead is real.

The governing principle: context quality matters more than quantity. Every optimization preserves signal while reducing noise. Measure before optimizing, then measure the optimization's effect.

## Detailed Topics

### Compaction Strategies

Trigger compaction when context utilization exceeds 70%: summarize the current context, then reinitialize with the summary. Prioritize compressing tool outputs first (they consume 80%+ of tokens), then old conversation turns, then retrieved documents. Never compress the system prompt — it anchors model behavior and its removal causes unpredictable degradation.

Preserve different elements by message type:
- **Tool outputs**: Extract key findings, metrics, error codes, and conclusions. Strip verbose raw output, stack traces (unless debugging is ongoing), and boilerplate headers.
- **Conversational turns**: Retain decisions, commitments, user preferences, and context shifts. Remove filler, pleasantries, and exploratory back-and-forth that led to a conclusion already captured.
- **Retrieved documents**: Keep claims, facts, and data points relevant to the active task. Remove supporting evidence and elaboration that served a one-time reasoning purpose.

Target 50-70% token reduction with less than 5% quality degradation.

### Observation Masking

Mask observations selectively based on recency and ongoing relevance — not uniformly:
- **Never mask**: Observations critical to the current task, from the most recent turn, used in active reasoning chains, or error outputs when debugging is in progress.
- **Mask after 3+ turns**: Verbose outputs whose key points have already been extracted. Replace with: \`[Obs:{ref_id} elided. Key: {summary}. Full content retrievable.]\`
- **Always mask immediately**: Repeated/duplicate outputs, boilerplate headers and footers, outputs already summarized.

### KV-Cache Optimization

Structure prompts so stable content occupies the prefix and dynamic content appears at the end:
1. System prompt (most stable)
2. Tool definitions (stable across requests)
3. Frequently reused templates and few-shot examples
4. Conversation history
5. Current query and dynamic content (least stable — always last)

Target 70%+ cache hit rate for stable workloads.

### Context Partitioning

Partition work across sub-agents when a single context cannot hold the full problem. Plan partitioning when estimated task context exceeds 60% of the window limit. Only partition when savings exceed coordination overhead — break-even typically requires 3+ subtasks.

### Budget Management

Allocate explicit token budgets: system prompt, tool definitions, retrieved documents, message history, tool outputs, and a reserved buffer (5-10% of total). Trigger optimization signals:
- Token utilization above 80% — trigger compaction
- Attention degradation indicators (repetition, missed instructions) — trigger masking + compaction
- Quality score drops below baseline — audit context composition

## Gotchas

1. **Whitespace breaks KV-cache**: Even a single whitespace change in the prompt prefix invalidates the entire cached block downstream. Pin system prompts as immutable strings.
2. **Timestamps in system prompts destroy cache hit rates**: Move dynamic metadata into a user message appended after the stable prefix.
3. **Compaction under pressure loses critical state**: Trigger compaction at 70-80%, not 90%+.
4. **Masking error outputs breaks debugging loops**: During active debugging, suspend masking for all error-related observations.
5. **Partitioning overhead can exceed savings**: Estimate total tokens before committing to partitioning.
6. **Compaction creates false confidence in stale summaries**: Re-validate the summary against the current task goal after compaction.`,
};
