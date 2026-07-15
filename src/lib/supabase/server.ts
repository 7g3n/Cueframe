import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Phase 1 auth is wired up before a Supabase project exists yet; callers
// must check this before touching the client so the site doesn't 500 in
// the meantime (see src/components/site-header.tsx, middleware.ts).
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render; session refresh is
            // handled by middleware instead, so this can be ignored.
          }
        },
      },
    },
  );
}
