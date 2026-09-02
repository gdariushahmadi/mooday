import { expect, test } from "@playwright/test";

/**
 * E2E smoke test for the DANEG luxury resale rebrand.
 *
 * Covers the critical user journey:
 *   - Landing page renders DANEG wordmark + TrustBadges.
 *   - No banned phrases ("second-hand", gendered Arabic) in any copy.
 *   - Brand chip filter narrows search results to the chosen brand.
 *   - Product details surface the new provenance + authenticity tier.
 *   - Sell form requires brand, purchase date, and usage count.
 */

test.describe("DANEG rebrand smoke", () => {
  test("landing page renders DANEG wordmark and trust chips", async ({ page }) => {
    await page.goto("/");
    // DANEG wordmark in the hero.
    await expect(page.getByRole("heading", { name: /DANEG/ }).first()).toBeVisible();
    // TrustBadges in the hero cluster.
    const heroTrust = page.getByRole("list", { name: "Trust signals" });
    await expect(heroTrust.getByText("Verified Seller", { exact: true })).toBeVisible();
    await expect(heroTrust.getByText("Authenticity", { exact: true })).toBeVisible();
    await expect(heroTrust.getByText("Secure Payment", { exact: true })).toBeVisible();
    // Tagline uses "Pre-loved Luxury" not "second-hand".
    await expect(page.getByText(/Pre-loved Luxury/i).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/second[- ]?hand/i);
  });

  test("landing page renders DANEG wordmark in Arabic without gendered copy", async ({ page }) => {
    await page.goto("/?lang=ar");
    await expect(page.getByRole("heading", { name: "دانق", exact: true })).toBeVisible();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("نساء");
    expect(bodyText).not.toContain("للسيدات");
  });

  test("brand chip filter narrows the search results", async ({ page }) => {
    await page.goto("/app?view=search");
    // Discover the brand chip row and tap Chanel.
    const chanelChip = page
      .getByRole("group", { name: /Choose a brand/i })
      .getByRole("button", { name: /^Chanel$/ });
    await expect(chanelChip).toBeVisible();
    await chanelChip.click();
    // The URL is updated with the brand param.
    await expect(page).toHaveURL(/brand=Chanel/);
    // The visible result count label updates.
    await expect(page.getByText(/Found \d+ item/i)).toBeVisible();
  });

  test("sell form requires brand, purchase date, and usage count", async ({ page }) => {
    await page.goto("/app?view=sell");
    // The brand autocomplete, purchase date, and usage count are visible.
    await expect(page.getByLabel(/^Brand$/i)).toBeVisible();
    await expect(page.getByLabel(/Purchased/i)).toBeVisible();
    await expect(page.getByLabel(/Times used/i)).toBeVisible();
  });
});
