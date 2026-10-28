import { http, HttpResponse } from "msw";

interface LoginRequest {
  email: string;
  password: string;
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    if (body.email === "test@example.com" && body.password === "password") {
      return HttpResponse.json({
        token: "mock-jwt-token",
        user: { id: "1", email: "test@example.com", name: "Test User" },
      });
    }
    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),

  http.get("/api/users", () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "John Doe", email: "john@example.com", role: "admin", status: "active", createdAt: new Date().toISOString() },
        { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user", status: "active", createdAt: new Date().toISOString() },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  }),
];