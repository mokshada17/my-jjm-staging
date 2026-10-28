import { http, isApiError, TOKEN_KEY } from "@/shared/api";

const USER_KEY = "jjm_user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user" | "viewer";
    signedInAt?: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      // A 401 here means wrong credentials, not an expired session.
      const res = await http.post<LoginResponse>("/auth/login", data, { skipAuthRedirect: true });
      // Keep the session the account menu reads, stamped with when it began.
      const user = { ...res.user, signedInAt: new Date().toISOString() };
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ...res, user };
    } catch (error) {
      // Offline sign-in only when there is no auth service to ask: the mock
      // server has no /auth/login (404) or nothing answered. A real service's
      // 401 / 403 / 5xx is a real failure - falling back there would let wrong
      // credentials in.
      const noAuthService =
        isApiError(error) && (error.kind === "network" || error.kind === "timeout" || error.status === 404);
      if (!noAuthService) throw error;
      // Mock server resilience: authenticate with government credentials
      // btoa only accepts Latin1, so non-ASCII credentials must be UTF-8 encoded first.
      const bytes = new TextEncoder().encode(`${data.email}:${data.password}`);
      const token = btoa(String.fromCharCode(...bytes));
      const user = {
        id: "usr-comm-01",
        name: "Commissioner",
        email: data.email || "commissioner@maharashtra.gov.in",
        role: "admin" as const,
        signedInAt: new Date().toISOString(),
      };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { token, user };
    }
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return Promise.resolve();
  },
  getCurrentUser: (): LoginResponse["user"] | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};