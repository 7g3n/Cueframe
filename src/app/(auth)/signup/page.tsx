"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">新規登録</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          お名前
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

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
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">ご利用者区分</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="client" defaultChecked />
            クライアント(依頼主)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="creator" />
            制作者(音楽・映像制作者)
          </label>
        </fieldset>

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
          {pending ? "登録中..." : "登録する"}
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
