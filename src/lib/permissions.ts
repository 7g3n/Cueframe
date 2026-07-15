import type { ProjectStatus, UserRole } from "@/types/database";

// Single source of truth for who can move a project into which status.
// Gated by the requester's role on THIS project (project_members.role_in_project)
// when they're a member, falling back to their global profile role for the
// owner (who never has their own membership row).
export const ALLOWED_STATUS_TRANSITIONS: Record<UserRole, ProjectStatus[]> = {
  client: ["approved"],
  creator: ["pending", "in_revision"],
  admin: ["pending", "in_revision", "approved"],
};

export function canTransitionStatus(
  role: UserRole,
  newStatus: ProjectStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[role].includes(newStatus);
}

export function availableStatusTransitions(
  role: UserRole,
  currentStatus: ProjectStatus,
): ProjectStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[role].filter(
    (status) => status !== currentStatus,
  );
}

// Uploading a version is a creator action: the project owner, or a member
// whose role_in_project is 'creator'. Mirrors versions_insert_creator RLS.
export function canUploadVersion(isOwner: boolean, role: UserRole): boolean {
  return isOwner || role === "creator";
}
