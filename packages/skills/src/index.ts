export type { Skill, SkillSource, SkillCategory, SkillReference } from "./types.js";

export { contextOptimization } from "./definitions/context-optimization.js";
export { frontendDesign } from "./definitions/frontend-design.js";
export { reactExpert } from "./definitions/react-expert.js";
export {
  updateConfig,
  keybindingsHelp,
  simplify,
  loop,
  schedule,
  claudeApi,
} from "./definitions/builtins.js";

import { contextOptimization } from "./definitions/context-optimization.js";
import { frontendDesign } from "./definitions/frontend-design.js";
import { reactExpert } from "./definitions/react-expert.js";
import {
  updateConfig,
  keybindingsHelp,
  simplify,
  loop,
  schedule,
  claudeApi,
} from "./definitions/builtins.js";
import type { Skill } from "./types.js";

/** All skills, ordered: file-based first, then built-ins */
export const ALL_SKILLS: Skill[] = [
  contextOptimization,
  frontendDesign,
  reactExpert,
  updateConfig,
  keybindingsHelp,
  simplify,
  loop,
  schedule,
  claudeApi,
];

/** Look up a skill by its id */
export function getSkill(id: string): Skill | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}

/** Filter skills by category */
export function getSkillsByCategory(
  category: Skill["category"]
): Skill[] {
  return ALL_SKILLS.filter((s) => s.category === category);
}
