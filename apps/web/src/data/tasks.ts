export interface TimelyTask {
  id: string;
  title: string;
  reason: string;
  dateRange?: { from?: string; to?: string };
}

export interface DailyTask {
  id: string;
  title: string;
  time?: string;
  done?: boolean;
  notes?: string;
}

export const TIMELY_TASKS: TimelyTask[] = [
  {
    id: "t1",
    title: "Catfood being discontinued",
    reason: "Buy as many cans as you can before stock runs out",
  },
  {
    id: "t2",
    title: "Submit tax return",
    reason: "Penalty applies after the due date — don't leave it",
    dateRange: { to: "2026-10-31" },
  },
  {
    id: "t3",
    title: "Book dentist appointment",
    reason: "It has been over a year — book before the end of the month",
    dateRange: { to: "2026-03-31" },
  },
];

export const DAILY_TASKS: DailyTask[] = [
  { id: "d1", title: "Morning walk",            time: "7:00 AM",  done: true },
  { id: "d2", title: "Team standup",            time: "9:00 AM",  notes: "Discuss the new deployment pipeline and blockers." },
  { id: "d3", title: "Review design feedback",  time: "10:30 AM", notes: "Check Figma comments — Sarah left notes on the dashboard layout." },
  { id: "d4", title: "Lunch",                   time: "12:30 PM" },
  { id: "d5", title: "Write week summary",      time: "4:00 PM",  notes: "Send to the team Slack channel. Include what shipped and what's blocked." },
  { id: "d6", title: "Evening run",             time: "6:30 PM" },
];
