export type UserRole = "client" | "creator" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}
