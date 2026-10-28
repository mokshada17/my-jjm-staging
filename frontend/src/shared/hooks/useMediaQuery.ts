import { useEffect, useState } from "react";

/**
 * Whether a CSS media query matches, updating as the window resizes. For layouts
 * that render a different component per breakpoint rather than hiding one with
 * CSS. Where `matchMedia` is missing (jsdom in tests) it returns `fallback`.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const supported = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [matches, setMatches] = useState(() => (supported ? window.matchMedia(query).matches : fallback));

  useEffect(() => {
    if (!supported) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query, supported]);

  return matches;
}
