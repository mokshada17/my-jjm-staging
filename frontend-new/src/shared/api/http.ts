/**
 * The one HTTP client every API module goes through (PI Web API, the §5 tables,
 * auth, users), built on axios.
 *
 * What it guarantees callers:
 *  - Requests time out (15s) instead of hanging a screen's loading state forever.
 *  - React Query's AbortSignal is honoured, so leaving a page cancels its requests.
 *  - Every failure is an ApiError with a `kind` (network / timeout / http /
 *    canceled / parse), the status and the URL, and `isRetryable` - so callers and
 *    the retry policy can tell a dead server from a bad request.
 *  - 204 and empty bodies resolve to `undefined` instead of throwing; malformed
 *    JSON is an error rather than a string silently passed on as data.
 *  - The session token is sent as a Bearer header; a 401 announces
 *    UNAUTHORIZED_EVENT so the app can end the session in one place.
 *  - GETs carry no body headers, so a cross-origin PI server is not sent a CORS
 *    preflight for every request.
 */
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

/** Mock server by default (`npm run mock:server`); endpoints carry their own `/api/...`. */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 15_000;

/** localStorage key the auth feature stores the session token under. */
export const TOKEN_KEY = "jjm_token";
/** Dispatched on `window` when a request comes back 401. */
export const UNAUTHORIZED_EVENT = "jjm:unauthorized";

export type ApiErrorKind = "network" | "timeout" | "http" | "canceled" | "parse";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly method: string;
  readonly url: string;
  /** Response body, when the server sent one. */
  readonly data?: unknown;
  /** The underlying axios (or other) error. */
  readonly cause?: unknown;

  constructor(
    message: string,
    init: { kind: ApiErrorKind; method: string; url: string; status?: number; data?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.cause = init.cause;
    this.kind = init.kind;
    this.status = init.status;
    this.method = init.method;
    this.url = init.url;
    this.data = init.data;
  }

  /**
   * Worth another attempt: the server was unreachable, slow, overloaded (5xx) or
   * rate-limiting (429). A 4xx other than 429 will fail the same way again, a
   * cancel was deliberate, and malformed data will not fix itself.
   */
  get isRetryable(): boolean {
    if (this.kind === "network" || this.kind === "timeout") return true;
    if (this.kind === "http" && this.status !== undefined) {
      return this.status >= 500 || this.status === 429;
    }
    return false;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export interface RequestOptions {
  /** Cancels the request, e.g. React Query's `signal` when a query is dropped. */
  signal?: AbortSignal;
  /** Overrides the default 15s timeout. */
  timeout?: number;
  /**
   * Skips the 401 -> end-session handling. For the login call itself, where a 401
   * means "wrong credentials", not "session expired".
   */
  skipAuthRedirect?: boolean;
}

type Params = Record<string, unknown>;

/**
 * Query string without empty values: `undefined`, `null` and `""` are dropped, so
 * an unset scope column never reaches the server as `?region=`.
 */
export function serializeParams(params: Params = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.append(key, String(value));
  }
  return search.toString();
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage blocked (private mode, sandboxed iframe)
  }
}

function toApiError(error: unknown, fallback: { method: string; url: string }): ApiError {
  if (isApiError(error)) return error;
  if (!(error instanceof AxiosError)) {
    return new ApiError(error instanceof Error ? error.message : "Request failed", {
      kind: "network",
      ...fallback,
      cause: error,
    });
  }
  const method = (error.config?.method ?? fallback.method).toUpperCase();
  const url = error.config?.url ?? fallback.url;
  const where = `${method} ${url}`;

  if (axios.isCancel(error) || error.code === AxiosError.ERR_CANCELED) {
    return new ApiError(`${where} was canceled`, { kind: "canceled", method, url, cause: error });
  }
  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
    return new ApiError(`${where} timed out`, { kind: "timeout", method, url, cause: error });
  }
  if (error.response) {
    const { status, data } = error.response;
    // Invalid JSON surfaces as ERR_BAD_RESPONSE with a 2xx status.
    if (status >= 200 && status < 300) {
      return new ApiError(`${where} returned malformed JSON`, { kind: "parse", method, url, status, data, cause: error });
    }
    return new ApiError(`${where} failed with HTTP ${status}`, { kind: "http", method, url, status, data, cause: error });
  }
  return new ApiError(`${where} could not reach the server`, { kind: "network", method, url, cause: error });
}

/**
 * One AbortSignal for a request that fires on the caller's cancel *or* after
 * `timeout` ms. The timeout is enforced here rather than by axios's `timeout`
 * option, which relies on the adapter (XHR's own timeout) and is not honoured in
 * every environment; an abort works the same everywhere.
 */
function requestSignal(timeout: number, caller?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  const onCallerAbort = () => controller.abort();
  if (caller?.aborted) controller.abort();
  else caller?.addEventListener("abort", onCallerAbort, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      caller?.removeEventListener("abort", onCallerAbort);
    },
  };
}

export class HttpClient {
  readonly axios: AxiosInstance;
  private readonly timeout: number;

  constructor(baseURL: string = API_BASE, timeout: number = DEFAULT_TIMEOUT_MS) {
    this.timeout = timeout;
    this.axios = axios.create({
      baseURL,
      headers: { Accept: "application/json" },
      paramsSerializer: { serialize: serializeParams },
      // Malformed JSON must throw, not arrive as a string typed as data.
      transitional: { silentJSONParsing: false, forcedJSONParsing: true, clarifyTimeoutError: true },
      responseType: "json",
    });

    this.axios.interceptors.request.use((config) => {
      const token = readToken();
      if (token && !config.headers.has("Authorization")) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
      return config;
    });
  }

  private async request<T>(config: AxiosRequestConfig, options: RequestOptions = {}): Promise<T> {
    const method = (config.method ?? "get").toUpperCase();
    const url = config.url ?? "";
    const abort = requestSignal(options.timeout ?? this.timeout, options.signal);
    try {
      const response = await this.axios.request<T>({ ...config, signal: abort.signal });
      // 204 / empty body: axios hands back "" - there is no data, not an empty string.
      if (response.status === 204 || (response.data as unknown) === "") return undefined as T;
      return response.data;
    } catch (error) {
      const apiError = abort.timedOut()
        ? new ApiError(`${method} ${url} timed out`, { kind: "timeout", method, url, cause: error })
        : toApiError(error, { method, url });
      if (apiError.status === 401 && !options.skipAuthRedirect && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: apiError }));
      }
      throw apiError;
    } finally {
      abort.dispose();
    }
  }

  get<T>(endpoint: string, params?: Params, options?: RequestOptions) {
    return this.request<T>({ method: "get", url: endpoint, params }, options);
  }

  /** GET that must return a JSON array; anything else is a `parse` error, not data. */
  async getList<T>(endpoint: string, params?: Params, options?: RequestOptions): Promise<T[]> {
    const data = await this.get<unknown>(endpoint, params, options);
    if (!Array.isArray(data)) {
      throw new ApiError(`GET ${endpoint} returned ${data === undefined ? "no body" : typeof data}, expected a list`, {
        kind: "parse",
        method: "GET",
        url: endpoint,
        data,
      });
    }
    return data as T[];
  }

  post<T>(endpoint: string, data: unknown, options?: RequestOptions) {
    return this.request<T>({ method: "post", url: endpoint, data }, options);
  }

  put<T>(endpoint: string, data: unknown, options?: RequestOptions) {
    return this.request<T>({ method: "put", url: endpoint, data }, options);
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>({ method: "delete", url: endpoint }, options);
  }
}

export const http = new HttpClient();
export const createHttpClient = (baseUrl?: string, timeout?: number) => new HttpClient(baseUrl, timeout);
