import { useEffect, useState } from "react";

/**
 * The current time, re-read every `intervalMs` while `active`. A live trend keys
 * its window on this, so it advances (and refetches) once per tick rather than
 * on every render.
 */
export function useNow(intervalMs = 60_000, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}
