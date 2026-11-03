export interface UserFormData {
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  status: "active" | "inactive";
}