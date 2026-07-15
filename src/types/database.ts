export type UserRole = "client" | "creator" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

export type ProjectStatus = "pending" | "in_revision" | "approved";
export type FileType = "audio" | "video" | "image" | "pdf";

export interface Project {
  id: string;
  title: string;
  owner_id: string;
  status: ProjectStatus;
  deadline: string | null;
  created_at: string;
}

export interface Version {
  id: string;
  project_id: string;
  version_number: number;
  file_path: string;
  file_type: FileType;
  created_at: string;
}
