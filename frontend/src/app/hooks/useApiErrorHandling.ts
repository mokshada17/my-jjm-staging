import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isApiError, UNAUTHORIZED_EVENT, type ApiError } from "@/shared/api";
import { useToast } from "@/shared/hooks/use-toast";
import { useLogout } from "@/features/auth/hooks/useLogout";

/** A burst of failures of one kind (five tables at once) shows a single toast. */
const DEDUPE_MS = 10_000;

/** What a failed load means for the person looking at the screen. */
export function describeApiError(error: ApiError): { title: string; description: string } {
  switch (error.kind) {
    case "network":
      return {
        title: "Server unreachable",
        description: "Couldn't reach the data server. Check the connection; data will load when it's back.",
      };
    case "timeout":
      return { title: "Server not responding", description: "A request took too long and was stopped." };
    case "parse":
      return { title: "Unexpected data", description: "The server sent data in a format the dashboard can't read." };
    default:
      return error.status !== undefined && error.status >= 500
        ? { title: "Server error", description: `The data server failed (HTTP ${error.status}).` }
        : { title: "Request rejected", description: `The data server refused the request (HTTP ${error.status}).` };
  }
}

/**
 * App-wide handling of API failures, in one place rather than on every screen:
 *  - a 401 from any request ends the session once and returns to login;
 *  - a query that has used up its retries raises a toast saying what went wrong.
 * Cancelled requests are deliberate and stay silent.
 */
export function useApiErrorHandling() {
  const { toast } = useToast();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const lastShown = useRef(new Map<string, number>());

  const notify = (key: string, content: { title: string; description: string }) => {
    const now = Date.now();
    if (now - (lastShown.current.get(key) ?? 0) < DEDUPE_MS) return;
    lastShown.current.set(key, now);
    toast({ ...content, variant: "destructive" });
  };

  // Session expiry
  useEffect(() => {
    const onUnauthorized = () => {
      if (pathname === "/login") return;
      notify("session", { title: "Session expired", description: "Please sign in again." });
      void logout();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify is stable in effect
  }, [logout, pathname]);

  // Failed loads, after React Query's retries
  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "error") return;
      const error = event.action.error;
      if (!isApiError(error) || error.kind === "canceled" || error.status === 401) return;
      notify(`${error.kind}:${error.status ?? ""}`, describeApiError(error));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify is stable in effect
  }, [queryClient]);
}
