import path from "path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Playwright doesn't auto-load .env.local the way Next.js does.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// This suite exercises the real app against the real Supabase project using
// two dedicated test accounts (creator + client) — see e2e/README.md. It's
// intentionally not wired into the default CI job, which has no live test
// credentials; run it locally with TEST_CREATOR_* / TEST_CLIENT_* set.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
