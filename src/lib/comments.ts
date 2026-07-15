import type { Comment } from "@/types/database";

export function filterUnresolved(
  comments: Comment[],
  showUnresolvedOnly: boolean,
): Comment[] {
  return showUnresolvedOnly
    ? comments.filter((comment) => !comment.resolved)
    : comments;
}
