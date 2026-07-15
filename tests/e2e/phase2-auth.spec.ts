import { expect, test } from "@playwright/test";

const mailpitUrl =
  process.env.SUPABASE_LOCAL_MAILPIT_URL ?? "http://127.0.0.1:54324";

async function waitForOtp(email: string): Promise<string> {
  await expect
    .poll(
      async () => {
        const response = await fetch(`${mailpitUrl}/api/v1/messages`);
        if (!response.ok) return null;
        const inbox = (await response.json()) as {
          messages?: Array<{
            ID: string;
            Subject?: string;
            To?: Array<{ Address?: string }>;
          }>;
        };
        const message = inbox.messages?.find(
          (item) =>
            item.To?.some((recipient) => recipient.Address === email) &&
            item.Subject?.includes("Confirm your Mooday account"),
        );
        if (!message) return null;

        const detailResponse = await fetch(
          `${mailpitUrl}/api/v1/message/${message.ID}`,
        );
        if (!detailResponse.ok) return null;
        const detail = (await detailResponse.json()) as {
          Subject?: string;
          Text?: string;
        };
        return `${detail.Subject ?? ""}\n${detail.Text ?? ""}`.match(
          /\b\d{6}\b/,
        )?.[0] ?? null;
      },
      { message: `confirmation OTP for ${email}`, timeout: 15_000 },
    )
    .not.toBeNull();

  const response = await fetch(`${mailpitUrl}/api/v1/messages`);
  const inbox = (await response.json()) as {
    messages: Array<{
      ID: string;
      Subject?: string;
      To?: Array<{ Address?: string }>;
    }>;
  };
  const message = inbox.messages.find(
    (item) =>
      item.To?.some((recipient) => recipient.Address === email) &&
      item.Subject?.includes("Confirm your Mooday account"),
  );
  if (!message) throw new Error("Confirmation message disappeared from Mailpit.");
  const detail = (await (
    await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`)
  ).json()) as { Subject?: string; Text?: string };
  const otp = `${detail.Subject ?? ""}\n${detail.Text ?? ""}`.match(
    /\b\d{6}\b/,
  )?.[0];
  if (!otp) throw new Error("Confirmation email did not contain a six-digit OTP.");
  return otp;
}

test("a new user can sign up and verify the emailed OTP", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `phase2-e2e-${suffix}@example.test`;
  const password = "Mooday-e2e-42!";

  await page.addInitScript(() => {
    localStorage.setItem("mooday_has_seen_welcome", "true");
    localStorage.setItem("mooday_language", "en");
  });
  await page.goto("/?view=signup");

  await expect(page.getByTestId("sign-up")).toBeVisible();
  await page.getByLabel("Full name").fill("Phase 2 Browser Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone (optional)").fill("+971500000000");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel("Accept terms").check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByTestId("otp-verify")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  const otp = await waitForOtp(email);
  for (const [index, digit] of [...otp].entries()) {
    await page.getByLabel(`6-digit code ${index + 1}`).fill(digit);
  }
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.getByTestId("otp-verify")).not.toBeVisible();
  await expect(page.getByTestId("app-header")).toBeVisible();
});
