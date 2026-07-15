import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// withSentryConfig only uploads source maps when SENTRY_AUTH_TOKEN is set
// (e.g. in CI); locally/without it, it's a harmless no-op wrapper.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
