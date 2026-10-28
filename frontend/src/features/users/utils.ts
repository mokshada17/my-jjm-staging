import type { User } from "./api/usersApi";

export function filterUsers(users: User[], filters: { role?: string; status?: string; search?: string }): User[] {
  return users.filter((user) => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    }
    return true;
  });
}

export function sortUsers(users: User[], field: keyof User, direction: "asc" | "desc" = "asc"): User[] {
  return [...users].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}