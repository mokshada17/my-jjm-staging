import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./http";

/** Attempts after the first for a retryable failure (network, timeout, 5xx, 429). */
const MAX_RETRIES = 2;

/**
 * Retry only what another attempt can fix: an unreachable, slow or overloaded
 * server. A 4xx, a deliberate cancel or malformed data would fail identically, so
 * the error surfaces at once instead of after three round trips.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) return error.isRetryable && failureCount < MAX_RETRIES;
  return false; // a bug in a queryFn, not a flaky network
}

/** 1s, 2s, 4s ... capped at 10s, with jitter so reconnecting clients don't sync up. */
export function retryDelay(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 10_000);
  return base / 2 + Math.random() * (base / 2);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: shouldRetry,
        retryDelay,
      },
      mutations: {
        // Writes are not idempotent in general; never repeat one automatically.
        retry: false,
      },
    },
  });
}
