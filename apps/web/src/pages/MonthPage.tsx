import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  fetchCalendarRange,
  fetchTasks,
  inferCategory,
  CATEGORY_COLORS,
} from "../lib/api.js";
import type { CalendarEvent, Task, Category } from "../lib/api.js";
import { localDateStr } from "../utils/dates.js";
import { CalendarPageNav } from "../components/calendar/CalendarPageNav.js";

// ---- Utilities ---------------------------------------------------------------

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

// ---- Dot computation ---------------------------------------------------------

function getDayDots(
  dayStr: string,
  calEvents: CalendarEvent[],
  tasksByDay: Map<string, Task[]>
): { category: Category; minutes: number }[] {
  const totals: Record<Category, number> = { work: 0, health: 0, social: 0, personal: 0, admin: 0 };
  for (const ev of calEvents.filter(e => localDateStr(new Date(e.start)) === dayStr)) {
    totals[inferCategory(ev.title)] += ev.allDay
      ? 30
      : Math.max(0, (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
  }
  for (const t of (tasksByDay.get(dayStr) ?? [])) {
    totals[inferCategory(t.title)] += 30;
  }
  return (Object.entries(totals) as [Category, number][])
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, minutes]) => ({ category, minutes }));
}

// ---- MonthPage ---------------------------------------------------------------

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");

  const [monthDate, setMonthDate] = useState<Date>(() =>
    getMonthStart(fromParam ? new Date(`${fromParam}T00:00:00`) : new Date())
  );

  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [tasksByDay, setTasksByDay] = useState<Map<string, Task[]>>(new Map());

  const monthEnd = getMonthEnd(monthDate);
  const gridStart = getWeekStart(getMonthStart(monthDate));

  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  while (cursor <= monthEnd || weeks.length < 4) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
    if (cursor > monthEnd && weeks.length >= 4) break;
  }

  const gridEnd = addDays(cursor, -1);
  const fromStr = localDateStr(gridStart);
  const toStr = localDateStr(gridEnd);

  useEffect(() => {
    fetchCalendarRange(fromStr, toStr).then(setCalEvents);
    const allDays = weeks.flat();
    Promise.all(allDays.map(d => fetchTasks(localDateStr(d)))).then(results => {
      const map = new Map<string, Task[]>();
      allDays.forEach((d, i) => map.set(localDateStr(d), results[i]));
      setTasksByDay(map);
    });
  }, [fromStr, toStr]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthLabel = (
    <span style={{
      fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700,
      letterSpacing: "-0.02em", color: "var(--accent)", padding: "0 8px",
    }}>
      {monthDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}
    >
      <CalendarPageNav
        label={monthLabel}
        onPrev={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        active="month"
        weekFromStr={fromStr}
      />

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 32px 0", flexShrink: 0 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: "center",
            fontFamily: "var(--font-mono)", fontSize: "0.6rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-muted)", padding: "4px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "grid", gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
        padding: "4px 32px 24px", gap: "2px",
      }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {week.map(day => {
              const dayStr = localDateStr(day);
              const isThisMonth = day.getMonth() === monthDate.getMonth();
              const isToday = day.getTime() === today.getTime();
              const dots = getDayDots(dayStr, calEvents, tasksByDay);

              return (
                <motion.div
                  key={dayStr}
                  layoutId={`cal-day-${dayStr}`}
                  onClick={() => navigate(`/?date=${dayStr}`)}
                  style={{
                    padding: "6px 8px", cursor: "pointer", borderRadius: "4px",
                    border: isToday ? "2px solid var(--accent)" : "2px solid transparent",
                    background: isToday ? "var(--bg-surface)" : "transparent",
                    opacity: isThisMonth ? 1 : 0.35,
                    minHeight: "56px",
                    display: "flex", flexDirection: "column", gap: "4px",
                  }}
                  whileHover={{ background: isToday ? "var(--bg-surface)" : "var(--bg-raised)" }}
                  transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
                >
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? "var(--accent)" : "var(--text-secondary)",
                    letterSpacing: "0.02em", lineHeight: 1,
                  }}>
                    {day.getDate()}
                  </span>
                  {dots.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                      {dots.map(({ category }, di) => (
                        <div key={di} title={category} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: CATEGORY_COLORS[category], flexShrink: 0,
                        }} />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
