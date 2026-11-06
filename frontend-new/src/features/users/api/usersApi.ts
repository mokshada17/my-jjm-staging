import { http, type RequestOptions } from "@/shared/api";
import { type PaginatedResponse } from "@/shared/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

/** User IDs go into the path, so they are encoded rather than trusted. */
const userPath = (id: string) => `/users/${encodeURIComponent(id)}`;

export const usersApi = {
  list: (params?: { page?: number; pageSize?: number }, options?: RequestOptions) =>
    http.get<PaginatedResponse<User>>("/users", params, options),
  get: (id: string, options?: RequestOptions) => http.get<User>(userPath(id), undefined, options),
  create: (data: Partial<User>) => http.post<User>("/users", data),
  update: (id: string, data: Partial<User>) => http.put<User>(userPath(id), data),
  delete: (id: string) => http.delete(userPath(id)),
};
