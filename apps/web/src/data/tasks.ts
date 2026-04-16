// Static data for timely tasks removed — data now lives in ~/.mzwxl/timely.json via MCP.
// Re-export TimelyTask from api.ts for any consumers that imported from here.
export type { TimelyTask } from "../lib/api.js";
