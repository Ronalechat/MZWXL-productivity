/**
 * Shared singleton store for active skill IDs.
 * Kept outside React so both SkillsPage and DashboardChat share the same set.
 */

import { ALL_SKILLS } from "@mzwxl/skills";

type Listener = (ids: Set<string>) => void;

const defaultId = ALL_SKILLS[0]?.id ?? "";
let activeIds: Set<string> = new Set(defaultId ? [defaultId] : []);
const listeners = new Set<Listener>();

export function getActiveSkillIds(): Set<string> {
  return activeIds;
}

export function setActiveSkillIds(next: Set<string>): void {
  activeIds = next;
  for (const l of listeners) l(activeIds);
}

export function subscribeSkillIds(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
