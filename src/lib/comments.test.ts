import { describe, expect, it } from "vitest";
import { filterUnresolved } from "./comments";
import type { Comment } from "@/types/database";

function makeComment(overrides: Partial<Comment>): Comment {
  return {
    id: "comment-1",
    version_id: "version-1",
    author_id: "user-1",
    timestamp_sec: 1.5,
    body: "test comment",
    resolved: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterUnresolved", () => {
  const comments = [
    makeComment({ id: "a", resolved: false }),
    makeComment({ id: "b", resolved: true }),
    makeComment({ id: "c", resolved: false }),
  ];

  it("returns every comment when the filter is off", () => {
    expect(filterUnresolved(comments, false)).toHaveLength(3);
  });

  it("keeps only unresolved comments when the filter is on", () => {
    const result = filterUnresolved(comments, true);
    expect(result.map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array when every comment is resolved", () => {
    const allResolved = [makeComment({ id: "x", resolved: true })];
    expect(filterUnresolved(allResolved, true)).toEqual([]);
  });
});
