import { test, expect } from "@playwright/test";

test("interface dark mode persists without changing the card design or editor data", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ colorScheme: "light" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/editor?type=card&sample=1");
  await page
    .getByLabel("Display name", { exact: true })
    .fill("Alex after dark");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(() =>
    localStorage.getItem("folio-studio-documents-v1"),
  );
  const preview = page.locator(".preview-panel .profile-card");
  const profileBackground = await preview.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".editor-panel")).toHaveCSS(
    "background-color",
    "rgb(30, 27, 40)",
  );
  await expect(page.getByLabel("Display name", { exact: true })).toHaveCSS(
    "background-color",
    "rgb(25, 22, 32)",
  );
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "Alex after dark",
  );
  await expect(preview).toHaveCSS("background-color", profileBackground);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("folio-studio-documents-v1"),
    ),
  ).toBe(saved);

  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Sage Green", exact: true }),
  ).toHaveCSS("background-color", "rgb(25, 22, 32)");
  await page.evaluate(() => {
    document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({ path: "test-results/dark-editor-desktop.png" });
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(30, 27, 40)",
  );
  await expect(page.locator(".share-qr svg")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await page.screenshot({ path: "test-results/dark-share-dialog.png" });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveCSS(
    "background-color",
    profileBackground,
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator(".public-card-wrap .profile-name")).toHaveText(
    "Alex after dark",
  );

  await page.goto("/dashboard");
  await expect(page.locator(".workspace-card")).toHaveCSS(
    "background-color",
    "rgb(30, 27, 40)",
  );
  await page.screenshot({ path: "test-results/dark-workspace.png" });
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  expect(errors).toEqual([]);
});

test("mobile mode follows the system until selected and syncs across tabs", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(page.getByRole("navigation")).toHaveCSS(
    "background-color",
    "rgb(30, 27, 40)",
  );
  await page
    .getByRole("button", { name: "Close navigation", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/dark-landing-mobile.png",
    fullPage: true,
  });
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Switch to light mode", exact: true }),
    ).toBeVisible();
  }
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  const second = await context.newPage();
  await second.goto("/create");
  await expect(second.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(second.locator("html")).toHaveAttribute(
    "data-color-mode",
    "dark",
  );
  await second.close();
});

test("the mode toggle still works when browser storage is unavailable", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage unavailable", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage unavailable", "SecurityError");
    };
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-mode",
    "light",
  );
  expect(errors).toEqual([]);
});
