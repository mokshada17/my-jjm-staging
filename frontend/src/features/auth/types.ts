export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  /** ISO time the session began; shown in the header's account menu. */
  signedInAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}