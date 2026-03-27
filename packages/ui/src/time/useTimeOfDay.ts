import { useState, useEffect } from "react";
import type { TimePeriod } from "./types.js";

function getTimePeriod(): TimePeriod {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
}

export function useTimeOfDay(): TimePeriod {
  const [period, setPeriod] = useState<TimePeriod>(getTimePeriod);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod(getTimePeriod());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return period;
}
