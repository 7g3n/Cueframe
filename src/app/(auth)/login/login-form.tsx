"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get("confirm") === "1";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">ログイン</h1>

      {justSignedUp && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          確認メールを送信しました。メール内のリンクから登録を完了してください。
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          メールアドレス
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          パスワード
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-background disabled:opacity-60"
        >
          {pending ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="font-medium underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
