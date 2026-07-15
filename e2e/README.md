# E2Eテスト(Playwright)

`upload-comment-approve.spec.ts` は実際のSupabaseプロジェクトに対して、実在する2つのテストアカウント(creator役・client役)を使い、
「プロジェクト作成 → ファイルアップロード → 波形上でコメント → 招待リンクでクライアントを招待 → クライアントが承認」という主要フローを一気通貫で検証します。

## 必要な環境変数

`.env.local` に以下を追加してください(実際のパスワードなので、`.env.local` はコミットされません):

```
TEST_CREATOR_EMAIL=
TEST_CREATOR_PASSWORD=
TEST_CLIENT_EMAIL=
TEST_CLIENT_PASSWORD=
```

いずれか未設定の場合、このテストはスキップされます(デフォルトのGitHub Actions CIには実アカウントの認証情報を置いていないため、CIでは意図的にスキップされます)。

## 実行方法

```bash
npm run test:e2e
```

`playwright.config.ts` が `npm run dev` を自動起動してから実行します。
