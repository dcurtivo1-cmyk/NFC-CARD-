import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("unavailable browser storage shows errors without claiming a save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });
  await page.goto("/editor?type=card");
  await page.getByLabel("Full name", { exact: false }).fill("Taylor Lee");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Could not save.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Auto-recovery unavailable. Save your draft.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("folio-studio-documents-v1"),
    ),
  ).toBeNull();
});

test("landing and selection are navigable and render at desktop and mobile sizes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Big possibilities.",
  );
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Create your free page" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with a little possibility." }),
  ).toBeVisible();
  await expect(page.locator(".selection-card")).toHaveCount(6);
  await page.getByRole("tab", { name: "Business", exact: true }).click();
  await expect(page.locator(".selection-card")).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "My workspace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your next great idea goes here." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("calling card journey validates, crops, customizes, saves, generates and exports", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/create?type=card");
  await page.getByRole("button", { name: /Start from scratch/ }).click();
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await page.getByLabel("Full name", { exact: false }).fill("Jordan Cruz");
  await page.getByLabel("Display name", { exact: true }).fill("Jordan");
  await page.getByLabel("Email address", { exact: true }).fill("broken");
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("jordan@example.com");
  await page
    .getByLabel("Phone number", { exact: true })
    .fill("+63 917 123 4567");
  await page.getByLabel("Website", { exact: true }).fill("https://example.com");
  await page.getByLabel("Address / location").fill("Makati, Metro Manila");
  await page
    .getByLabel("A little about you")
    .fill("A thoughtful designer, making good things.");
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("Upload profile photo", { exact: true }).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Zoom", { exact: true }).fill("1.5");
  await expect(
    page.getByRole("button", { name: "Use this image" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Use this image" }).click();
  await expect(page.getByAltText("Profile photo preview")).toBeVisible();
  expect(
    await page.getByAltText("Profile photo preview").getAttribute("src"),
  ).toMatch(/^data:image\/jpeg/);
  await page.getByRole("button", { name: "Remove profile photo" }).click();
  await expect(page.getByAltText("Profile photo preview")).toHaveCount(0);
  await page.getByRole("button", { name: "Add a custom link" }).click();
  await page
    .getByLabel("Button label", { exact: true })
    .fill("Book a conversation");
  await page
    .getByLabel("Link URL", { exact: true })
    .fill("https://example.com/book");
  await expect(page.locator(".preview-panel .profile-name")).toHaveText(
    "Jordan",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Draft saved to your workspace.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Premium Dark", exact: true }).click();
  await page.getByLabel("Font family").selectOption("serif");
  await page.getByLabel("Corner radius", { exact: false }).fill("22");
  await page.getByRole("button", { name: "Outline", exact: true }).click();
  await expect(page.locator(".preview-panel .profile-card")).toHaveClass(
    /button-outline/,
  );
  await page.evaluate(() => {
    document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: "test-results/editor-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Preview my page", exact: true })
    .click();
  await page.getByRole("button", { name: "Generate my demo" }).click();
  await expect(page).toHaveURL(/\/p\/fl-/);
  await expect(page.getByRole("dialog")).toBeVisible();
  const url = await page.getByLabel("Your actual profile URL").inputValue();
  expect(url).toBe(page.url());
  await expect(
    page.getByText("This is a local demo link.", { exact: true }),
  ).toBeVisible();
  const pngPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download QR · PNG", exact: true })
    .click();
  const png = await pngPromise;
  expect(png.suggestedFilename()).toMatch(/qr\.png$/);
  const bytes = await readFile(await png.path());
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  const svgPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  const svg = await svgPromise;
  expect(await readFile(await svg.path(), "utf8")).toContain("<svg");
  const vcardPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export contact/ }).click();
  const vcard = await vcardPromise;
  expect(await readFile(await vcard.path(), "utf8")).toContain(
    "FN:Jordan Cruz",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy shareable URL" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".public-card-wrap .profile-position")).toHaveCount(
    0,
  );
  await expect(
    page.locator('.public-card-wrap a[href="tel:+639171234567"]'),
  ).toBeVisible();
  await expect(
    page.locator('.public-card-wrap a[href^="mailto:"]'),
  ).toHaveAttribute("href", "mailto:jordan%40example.com");
  await expect(
    page.locator(
      '.public-card-wrap a[href^="https://www.google.com/maps/search/"]',
    ),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".public-card-wrap .profile-name")).toHaveText(
    "Jordan",
  );
  await page.getByRole("link", { name: "Edit page", exact: true }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Jordan Updated");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.goto(url);
  await expect(page.locator(".public-card-wrap .profile-name")).toHaveText(
    "Jordan Updated",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/profile-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "My workspace", exact: true })
    .last()
    .click();
  await expect(page.locator(".workspace-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Duplicate Jordan Cruz", exact: true })
    .click();
  await expect(page.locator(".workspace-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Delete Jordan Cruz (copy)", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete page", exact: true }).click();
  await expect(page.locator(".workspace-card")).toHaveCount(1);
  const privateContext = await context.browser().newContext();
  const otherPage = await privateContext.newPage();
  await otherPage.goto(url);
  await expect(
    otherPage.getByRole("heading", {
      name: "This little page isn’t here yet.",
    }),
  ).toBeVisible();
  await privateContext.close();
  expect(errors).toEqual([]);
});

test("mobile menu editor persists items, confirms reset, and recovers a draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor?type=menu&sample=1");
  await page.getByRole("button", { name: "Add a menu item" }).click();
  await page
    .getByLabel("Item name", { exact: true })
    .last()
    .fill("Coconut cold brew");
  await page.getByLabel("Price", { exact: true }).last().fill("₱190");
  await page
    .getByLabel("Description", { exact: true })
    .last()
    .fill("Cold, creamy, delicious.");
  await page.getByLabel("Category", { exact: true }).last().fill("Coffee");
  await expect(page.locator(".preview-panel .profile-menu-item")).toHaveCount(
    3,
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Keep working" }).click();
  await expect(page.getByLabel("Item name", { exact: true })).toHaveCount(3);
  await page.evaluate(() => {
    document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: "test-results/editor-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByText("Recovery copy saved in this browser"),
  ).toBeVisible();
  await page.goto("/editor?resume=1");
  await expect(
    page.getByLabel("Item name", { exact: true }).last(),
  ).toHaveValue("Coconut cold brew");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.goto("/dashboard");
  await expect(page.locator(".workspace-card")).toHaveCount(1);
  await page.getByLabel("Search saved pages").fill("not here");
  await expect(
    page.getByRole("heading", { name: "No pages in this little corner." }),
  ).toBeVisible();
  await page.getByLabel("Search saved pages").clear();
  await page.getByRole("link", { name: "Edit page", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Reset editor", exact: true }).click();
  await expect(
    page.getByLabel("Page / business name", { exact: false }),
  ).toHaveValue("");
  await page.goto("/dashboard");
  await expect(page.locator(".workspace-card")).toHaveCount(1);
});

test("every non-card product can generate a distinct local profile", async ({
  page,
}) => {
  for (const type of ["menu", "brochure", "review", "social", "nfc"]) {
    await page.goto(`/editor?type=${type}&sample=1`);
    if (type === "review")
      await page
        .getByLabel("Google review URL")
        .fill("https://g.page/r/example/review");
    await page
      .getByRole("button", { name: "Final look", exact: false })
      .click();
    await page
      .getByRole("button", { name: "Generate my demo", exact: true })
      .click();
    await expect(page).toHaveURL(/\/p\/fl-/);
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(page.locator(".public-card-wrap .profile-name")).toHaveText(
      "Sunday Studio",
    );
    if (type === "menu")
      await expect(
        page.locator(".public-card-wrap .profile-menu-item"),
      ).toHaveCount(2);
    if (type === "review")
      await expect(
        page.getByRole("link", { name: "Leave a Google review", exact: false }),
      ).toHaveAttribute("href", "https://g.page/r/example/review");
  }
  await page.goto("/dashboard");
  await expect(page.locator(".workspace-card")).toHaveCount(5);
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
  });
});
