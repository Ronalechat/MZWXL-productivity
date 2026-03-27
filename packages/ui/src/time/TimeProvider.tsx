import { useEffect, type ReactNode } from "react";
import { useTimeOfDay } from "./useTimeOfDay.js";

export function TimeProvider({ children }: { children: ReactNode }) {
  const period = useTimeOfDay();

  useEffect(() => {
    document.documentElement.dataset.tod = period;
  }, [period]);

  return <>{children}</>;
}
