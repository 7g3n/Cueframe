import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Supabaseが未設定のため、この機能はまだ利用できません。
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold">ダッシュボード</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        ようこそ、{profile?.name ?? user.email} さん
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        ロール: {profile?.role ?? "unknown"}
      </p>
    </div>
  );
}
