"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface AuthFormState {
  error: string | null;
}

const NOT_CONFIGURED_ERROR: AuthFormState = {
  error: "Supabaseが未設定のため、この機能はまだ利用できません。",
};

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return NOT_CONFIGURED_ERROR;
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") ?? "client") as UserRole;

  if (role !== "client" && role !== "creator") {
    return { error: "無効なロールです。" };
  }

  if (!isSupabaseConfigured()) {
    return NOT_CONFIGURED_ERROR;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?confirm=1");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
