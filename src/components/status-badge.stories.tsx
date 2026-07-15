import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Components/StatusBadge",
  component: StatusBadge,
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Pending: Story = {
  args: { status: "pending" },
};

export const InRevision: Story = {
  args: { status: "in_revision" },
};

export const Approved: Story = {
  args: { status: "approved" },
};
