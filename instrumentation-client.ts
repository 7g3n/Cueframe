import * as Sentry from "@sentry/nextjs";

// No-ops until NEXT_PUBLIC_SENTRY_DSN is set, same graceful-degradation
// pattern as isSupabaseConfigured() — see src/lib/supabase/server.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
