import path from "path";
import { expect, test, type Page } from "@playwright/test";

// This suite drives the real app against the real Supabase project with two
// dedicated test accounts. See e2e/README.md for the required env vars; it's
// skipped entirely if they aren't set (e.g. in default CI).
const CREATOR_EMAIL = process.env.TEST_CREATOR_EMAIL;
const CREATOR_PASSWORD = process.env.TEST_CREATOR_PASSWORD;
const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD;

test.skip(
  !CREATOR_EMAIL || !CREATOR_PASSWORD || !CLIENT_EMAIL || !CLIENT_PASSWORD,
  "Requires TEST_CREATOR_EMAIL/PASSWORD and TEST_CLIENT_EMAIL/PASSWORD — see e2e/README.md.",
);

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "メールアドレス" }).fill(email);
  await page.getByRole("textbox", { name: "パスワード" }).fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.waitForURL("**/dashboard");
}

test("upload → comment → approve, handed off from creator to client", async ({
  page,
  browser,
}) => {
  const projectTitle = `E2E Test ${Date.now()}`;

  // --- Creator: create the project, upload a version, leave a comment ---
  await login(page, CREATOR_EMAIL!, CREATOR_PASSWORD!);

  await page.getByRole("textbox", { name: "プロジェクト名" }).fill(projectTitle);
  await page.getByRole("button", { name: "新規プロジェクト作成" }).click();
  await expect(
    page.getByRole("heading", { name: projectTitle }),
  ).toBeVisible();
  const projectUrl = page.url();

  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures/test-audio.wav"));
  await expect(page.getByText("v1(audio)")).toBeVisible();

  await page.getByRole("link", { name: "レビュー" }).click();
  await expect(page.getByRole("button", { name: "再生" })).toBeVisible();

  const waveform = page.getByTestId("waveform");
  await waveform.waitFor({ state: "visible" });
  const box = await waveform.boundingBox();
  if (!box) throw new Error("waveform did not render a bounding box");
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);

  const commentText = "ここのミックスバランスを確認してください";
  await page.getByRole("textbox").last().fill(commentText);
  await page.getByRole("button", { name: "コメントを投稿" }).click();
  await expect(page.getByText(commentText)).toBeVisible();

  // --- Creator: invite the client (default role option is already "client") ---
  await page.getByRole("link", { name: "プロジェクトに戻る" }).click();
  await page.getByRole("button", { name: "招待リンクを発行" }).click();
  const inviteLink = await page.getByLabel("招待リンク").inputValue();
  expect(inviteLink).toContain("/invites/");

  // --- Client: join via the invite link, then approve ---
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  try {
    await login(clientPage, CLIENT_EMAIL!, CLIENT_PASSWORD!);
    await clientPage.goto(inviteLink);
    await clientPage.getByRole("button", { name: "参加する" }).click();
    await expect(
      clientPage.getByRole("heading", { name: projectTitle }),
    ).toBeVisible();

    await clientPage.getByRole("button", { name: "承認する" }).click();
    await expect(clientPage.getByText("承認済み")).toBeVisible();
  } finally {
    await clientContext.close();
  }

  // --- Cleanup: creator deletes the test project ---
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(projectUrl);
  await page.getByRole("button", { name: "プロジェクトを削除" }).click();
  await page.waitForURL("**/dashboard");
});
