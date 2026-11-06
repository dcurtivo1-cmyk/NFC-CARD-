import { test, expect } from "@playwright/test";
import { createDocument } from "../../src/data/presets.js";

test("an existing local demo can publish without changing its saved design", async ({
  page,
  browser,
}) => {
  const legacy = {
    ...createDocument("nfc", true),
    id: `fl-${crypto.randomUUID()}`,
    status: "generated",
  };
  legacy.design.headerLayout = "centered";
  await page.goto("/");
  await page.evaluate(
    (document) =>
      localStorage.setItem(
        "folio-studio-documents-v1",
        JSON.stringify([document]),
      ),
    legacy,
  );
  await page.goto(`/p/${legacy.id}`);
  await page.getByRole("button", { name: "Share & QR", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download QR", exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Publish page", exact: true }).click();
  const input = page.getByLabel("Your actual profile URL");
  await expect(input).toBeVisible();
  const url = await input.inputValue();
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(stored.publishedUrl).toBe(url);
  expect(stored.design).toEqual(legacy.design);
  const visitor = await browser.newContext();
  try {
    const other = await visitor.newPage();
    await other.goto(url);
    await expect(other.locator(".public-card-wrap .profile-name")).toHaveText(
      "Sunday Studio",
    );
    await expect(other.locator(".public-card-wrap .profile-card")).toHaveClass(
      /header-centered/,
    );
  } finally {
    await visitor.close();
  }
});

test("failed publication stays editable, retries safely, and remote deletion invalidates the NFC URL", async ({
  page,
  browser,
}) => {
  await page.goto("/editor?type=card&sample=1");
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page.route("**/api/pages/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Storage unavailable; please retry." }),
    }),
  );
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await expect(
    page.getByText("Storage unavailable; please retry.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/editor/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.publishedAt).toBeFalsy();
  await page.unroute("**/api/pages/*");
  await page
    .getByRole("button", { name: "Update demo profile", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/p/${saved.id}`));
  const url = await page.getByLabel("Your actual profile URL").inputValue();
  const visitor = await browser.newContext();
  try {
    const other = await visitor.newPage();
    await other.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("Storage disabled");
      };
    });
    await other.goto(url);
    await expect(other.locator(".public-card-wrap .profile-name")).toHaveText(
      "Alex Morgan",
    );
    await expect(
      other.locator(".public-card-wrap img.profile-avatar"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: "Delete Alex Morgan", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete page", exact: true })
      .click();
    await expect(page.locator(".workspace-card")).toHaveCount(0);
    await other.reload();
    await expect(
      other.getByRole("heading", { name: "This little page isn’t here yet." }),
    ).toBeVisible();
  } finally {
    await visitor.close();
  }
});
