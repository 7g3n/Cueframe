import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the Japanese label for each status", () => {
    const { rerender } = render(<StatusBadge status="pending" />);
    expect(screen.getByText("確認待ち")).toBeInTheDocument();

    rerender(<StatusBadge status="in_revision" />);
    expect(screen.getByText("修正中")).toBeInTheDocument();

    rerender(<StatusBadge status="approved" />);
    expect(screen.getByText("承認済み")).toBeInTheDocument();
  });
});
