import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ABPlayer } from "./ab-player";

const meta: Meta<typeof ABPlayer> = {
  title: "Components/ABPlayer",
  component: ABPlayer,
  parameters: {
    // wavesurfer.js renders into a real <canvas>, which needs actual layout;
    // Storybook's default iframe handles that fine, but keep the story wide.
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ABPlayer>;

export const Default: Story = {
  args: {
    labelA: "v1",
    labelB: "v2",
    urlA: "/storybook-sample.wav",
    urlB: "/storybook-sample.wav",
  },
};
