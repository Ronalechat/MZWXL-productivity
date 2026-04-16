import type { TimelyTask } from "../data/tasks.js";

export function formatDateRange(range: NonNullable<TimelyTask["dateRange"]>): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`;
  if (range.to) return `Due ${fmt(range.to)}`;
  if (range.from) return `From ${fmt(range.from)}`;
  return "";
}

export function getUrgencyTier(task: TimelyTask): 0 | 1 | 2 | 3 {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (task.dateRange?.to) {
    const days = Math.floor(
      (new Date(task.dateRange.to).getTime() - today.getTime()) / 86400000
    );
    if (days <= 3) return 3;
    if (days <= 7) return 2;
    if (days <= 30) return 1;
    return 0;
  }
  if (task.createdAt) {
    const stale = Math.floor(
      (today.getTime() - new Date(task.createdAt).getTime()) / 86400000
    );
    if (stale >= 30) return 2;
    if (stale >= 14) return 1;
  }
  return 0;
}

export function sortByUrgency(tasks: TimelyTask[]): TimelyTask[] {
  return [...tasks].sort((a, b) => {
    const ta = getUrgencyTier(a);
    const tb = getUrgencyTier(b);
    if (ta !== tb) return tb - ta;
    const daysLeft = (t: TimelyTask) => {
      if (t.dateRange?.to) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor((new Date(t.dateRange.to).getTime() - today.getTime()) / 86400000);
      }
      return Infinity;
    };
    return daysLeft(a) - daysLeft(b);
  });
}
