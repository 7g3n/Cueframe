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

export interface Comment {
  id: string;
  version_id: string;
  author_id: string;
  timestamp_sec: number | null;
  body: string;
  resolved: boolean;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role_in_project: UserRole;
  created_at: string;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  role_in_project: UserRole;
  token: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface ShareLink {
  id: string;
  project_id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}
