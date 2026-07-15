import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
      <Link href="/" className="font-semibold tracking-tight">
        Cueframe
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard">ダッシュボード</Link>
            <form action={signOut}>
              <button type="submit" className="underline">
                ログアウト
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">ログイン</Link>
            <Link href="/signup">新規登録</Link>
          </>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
