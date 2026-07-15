import { describe, expect, it } from "vitest";
import {
  availableStatusTransitions,
  canTransitionStatus,
  canUploadVersion,
} from "./permissions";

describe("canTransitionStatus", () => {
  it("client can only approve", () => {
    expect(canTransitionStatus("client", "approved")).toBe(true);
    expect(canTransitionStatus("client", "pending")).toBe(false);
    expect(canTransitionStatus("client", "in_revision")).toBe(false);
  });

  it("creator can set pending or in_revision, but not approve", () => {
    expect(canTransitionStatus("creator", "pending")).toBe(true);
    expect(canTransitionStatus("creator", "in_revision")).toBe(true);
    expect(canTransitionStatus("creator", "approved")).toBe(false);
  });

  it("admin can set any status", () => {
    expect(canTransitionStatus("admin", "pending")).toBe(true);
    expect(canTransitionStatus("admin", "in_revision")).toBe(true);
    expect(canTransitionStatus("admin", "approved")).toBe(true);
  });
});

describe("availableStatusTransitions", () => {
  it("excludes the current status from the offered transitions", () => {
    expect(availableStatusTransitions("creator", "pending")).toEqual([
      "in_revision",
    ]);
    expect(availableStatusTransitions("creator", "in_revision")).toEqual([
      "pending",
    ]);
  });

  it("returns an empty list when the only allowed status is already current", () => {
    expect(availableStatusTransitions("client", "approved")).toEqual([]);
  });

  it("client always sees just 'approved' unless already approved", () => {
    expect(availableStatusTransitions("client", "pending")).toEqual([
      "approved",
    ]);
  });
});

describe("canUploadVersion", () => {
  it("the project owner can always upload, regardless of their role", () => {
    expect(canUploadVersion(true, "client")).toBe(true);
    expect(canUploadVersion(true, "creator")).toBe(true);
  });

  it("a creator member (non-owner) can upload", () => {
    expect(canUploadVersion(false, "creator")).toBe(true);
  });

  it("a client member (non-owner) cannot upload", () => {
    expect(canUploadVersion(false, "client")).toBe(false);
  });
});
