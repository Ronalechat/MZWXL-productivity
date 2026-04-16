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

// ---- Time constants ----------------------------------------------------------

const DAY_START_MIN = 6 * 60;
const DAY_END_MIN   = 22 * 60;
const DAY_RANGE_MIN = DAY_END_MIN - DAY_START_MIN;

// ---- Utilities ---------------------------------------------------------------

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function formatWeekLabel(start: Date): string {
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-AU", opts)} – ${end.toLocaleDateString("en-AU", { ...opts, year: "numeric" })}`;
}

function formatHour(min: number): string {
  const h = Math.floor(min / 60);
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

// ---- Bar positioning ---------------------------------------------------------

interface Bar {
  leftPct: number;
  widthPct: number;
  category: Category;
  title: string;
  isTask: boolean;
}

function eventToBar(ev: CalendarEvent): Bar | null {
  if (ev.allDay) return null;
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  let s = Math.max(start.getHours() * 60 + start.getMinutes(), DAY_START_MIN);
  let e = Math.min(end.getHours() * 60 + end.getMinutes(), DAY_END_MIN);
  if (e <= s) return null;
  return {
    leftPct: ((s - DAY_START_MIN) / DAY_RANGE_MIN) * 100,
    widthPct: ((e - s) / DAY_RANGE_MIN) * 100,
    category: inferCategory(ev.title),
    title: ev.title,
    isTask: false,
  };
}

function taskToBar(t: Task): Bar | null {
  if (!t.time) return null;
  const [h, m] = t.time.split(":").map(Number);
  let s = Math.max(h * 60 + (m || 0), DAY_START_MIN);
  let e = Math.min(s + 30, DAY_END_MIN);
  if (e <= s) return null;
  return {
    leftPct: ((s - DAY_START_MIN) / DAY_RANGE_MIN) * 100,
    widthPct: ((e - s) / DAY_RANGE_MIN) * 100,
    category: inferCategory(t.title),
    title: t.title,
    isTask: true,
  };
}

// ---- Stats -------------------------------------------------------------------

function computeStats(events: CalendarEvent[], tasks: Task[]): { category: Category; minutes: number }[] {
  const totals: Record<Category, number> = { work: 0, health: 0, social: 0, personal: 0, admin: 0 };
  for (const ev of events) {
    if (ev.allDay) continue;
    totals[inferCategory(ev.title)] += Math.max(0, (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
  }
  for (const t of tasks) {
    if (t.time) totals[inferCategory(t.title)] += 30;
  }
  return (Object.entries(totals) as [Category, number][])
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, minutes]) => ({ category, minutes }));
}

// ---- Time axis ---------------------------------------------------------------

const TIME_LABELS = Array.from({ length: 9 }, (_, i) => DAY_START_MIN + i * 120);

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "0.95rem",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  display: "block",
};

// ---- WeekPage ----------------------------------------------------------------

export function WeekPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedParam = searchParams.get("selected");

  const [weekStart, setWeekStart] = useState<Date>(() =>
    getWeekStart(selectedParam ? new Date(`${selectedParam}T00:00:00`) : new Date())
  );

  const [initialSelected] = useState(selectedParam);

  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [tasksByDay, setTasksByDay] = useState<Task[][]>(Array.from({ length: 7 }, () => []));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const fromStr = localDateStr(weekStart);
  const toStr = localDateStr(addDays(weekStart, 6));

  useEffect(() => {
    fetchCalendarRange(fromStr, toStr).then(setCalEvents);
    Promise.all(days.map((d) => fetchTasks(localDateStr(d)))).then(setTasksByDay);
  }, [fromStr, toStr]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats = computeStats(calEvents, tasksByDay.flat());

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const ev of calEvents) {
    const key = localDateStr(new Date(ev.start));
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(ev);
  }

  const weekLabel = (
    <span style={{
      fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700,
      letterSpacing: "-0.02em", color: "var(--text-secondary)", padding: "0 8px",
    }}>
      {formatWeekLabel(weekStart)}
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
        label={weekLabel}
        onPrev={() => setWeekStart(d => addDays(d, -7))}
        onNext={() => setWeekStart(d => addDays(d, 7))}
        active="week"
        weekFromStr={fromStr}
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 24px" }}>
        {/* Time axis */}
        <div style={{ display: "flex", paddingTop: "12px", marginBottom: "4px" }}>
          <div style={{ width: "110px", flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative", height: "20px" }}>
            {TIME_LABELS.map(min => (
              <span key={min} style={{
                position: "absolute",
                left: `${((min - DAY_START_MIN) / DAY_RANGE_MIN) * 100}%`,
                transform: "translateX(-50%)",
                fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                color: "var(--text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap",
              }}>
                {formatHour(min)}
              </span>
            ))}
          </div>
        </div>

        {/* Day rows */}
        {days.map((day, idx) => {
          const dayStr = localDateStr(day);
          const isToday = day.getTime() === today.getTime();
          const isSelected = dayStr === initialSelected;
          const dayEvents = eventsByDay.get(dayStr) ?? [];
          const dayTasks = tasksByDay[idx] ?? [];
          const allDayEvs = dayEvents.filter(e => e.allDay);
          const bars: Bar[] = [
            ...dayEvents.map(eventToBar).filter((b): b is Bar => b !== null),
            ...dayTasks.map(taskToBar).filter((b): b is Bar => b !== null),
          ];
          const unscheduled = dayTasks.filter(t => !t.time);
          const dayLabelId = isSelected ? "cal-date" : `cal-day-${dayStr}`;

          return (
            <div key={dayStr} style={{
              display: "flex", alignItems: "stretch", minHeight: "40px",
              background: isToday ? "var(--bg-surface)" : "transparent",
              borderRadius: "4px", marginBottom: "3px",
            }}>
              <motion.div
                layoutId={dayLabelId}
                style={{
                  width: "110px", flexShrink: 0,
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  padding: "6px 12px 6px 0", cursor: "pointer",
                }}
                onClick={() => navigate(`/?date=${dayStr}`)}
              >
                <span style={{ ...labelStyle, color: isToday ? "var(--accent)" : "var(--text)" }}>
                  {day.toLocaleDateString("en-AU", { weekday: "short" })} {day.getDate()}
                </span>
                {allDayEvs.length > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                    {allDayEvs.map(e => e.title).join(", ")}
                  </span>
                )}
              </motion.div>

              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                {TIME_LABELS.map(min => (
                  <div key={min} style={{
                    position: "absolute", left: `${((min - DAY_START_MIN) / DAY_RANGE_MIN) * 100}%`,
                    top: 0, bottom: 0, width: "1px", background: "var(--border)", opacity: 0.4,
                  }} />
                ))}
                {bars.map((bar, bi) => (
                  <div
                    key={bi}
                    title={`${bar.category.charAt(0).toUpperCase() + bar.category.slice(1)}: ${bar.title}`}
                    style={{
                      position: "absolute",
                      left: `${bar.leftPct}%`,
                      width: `${Math.max(bar.widthPct, 0.5)}%`,
                      top: bar.isTask ? "30%" : "15%",
                      bottom: bar.isTask ? "30%" : "15%",
                      background: CATEGORY_COLORS[bar.category],
                      borderRadius: "3px", opacity: 0.85,
                    }}
                  />
                ))}
                {unscheduled.length > 0 && (
                  <div style={{ position: "absolute", right: "4px", display: "flex", gap: "3px", alignItems: "center" }}>
                    {unscheduled.slice(0, 5).map((t, ti) => (
                      <div key={ti} title={t.title} style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: CATEGORY_COLORS[inferCategory(t.title)], opacity: 0.6,
                      }} />
                    ))}
                    {unscheduled.length > 5 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)" }}>
                        +{unscheduled.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Stats strip */}
        {stats.length > 0 && (
          <div style={{
            marginTop: "24px", paddingTop: "16px",
            borderTop: "var(--rule-weight-light) solid var(--border)",
            display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.6rem",
              letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)",
            }}>
              Week total
            </span>
            {stats.map(({ category, minutes }) => {
              const h = Math.floor(minutes / 60), m = minutes % 60;
              return (
                <div key={category} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLORS[category] }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {category} {h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
