import { test, expect } from "@playwright/test";

test("design options update the live card and survive draft load and profile generation", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/editor?type=card&sample=1");
  await page
    .getByRole("button", { name: "Add a custom link", exact: true })
    .click();
  await page
    .getByLabel("Button label", { exact: true })
    .last()
    .fill("Book a call");
  await page
    .getByLabel("Link URL", { exact: true })
    .last()
    .fill("https://example.com/book");
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  const preview = page.locator(".preview-panel .profile-card");
  const choose = async (group, name) =>
    page
      .getByRole("group", { name: group, exact: true })
      .getByRole("button", { name, exact: true })
      .click();

  for (const [name, header] of [
    ["Modern Blue", "split"],
    ["Premium Dark", "centered"],
    ["Minimal Light", "minimal"],
    ["Elegant", "centered"],
    ["Gradient", "classic"],
  ]) {
    await choose("Template", name);
    await expect(preview).toHaveClass(new RegExp(`header-${header}`));
    await expect(page.locator(".preview-panel .profile-name")).toHaveText(
      "Alex Morgan",
    );
  }

  for (const [name, color, background, text] of [
    ["Ocean Blue", "#3269d5", "rgb(243, 247, 255)", "rgb(24, 45, 77)"],
    ["Midnight", "#bcb0fa", "rgb(32, 33, 43)", "rgb(246, 244, 255)"],
    ["Warm Sunset", "#ad493b", "rgb(255, 247, 241)", "rgb(84, 46, 41)"],
    ["Sage Green", "#376953", "rgb(244, 248, 242)", "rgb(36, 62, 49)"],
  ]) {
    await choose("Color palette presets", name);
    expect(
      await preview.evaluate((el) =>
        el.style.getPropertyValue("--profile-primary"),
      ),
    ).toBe(color);
    await expect(preview).toHaveCSS("background-color", background);
    await expect(preview.locator(".profile-name")).toHaveCSS("color", text);
    await expect(preview.locator(".profile-content")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(preview.locator(".portrait-fade")).toHaveCSS(
      "background-image",
      `linear-gradient(rgba(0, 0, 0, 0), ${background})`,
    );
    await expect(preview).toHaveClass(/header-classic/);
  }
  for (const [name, id] of [
    ["Centered", "centered"],
    ["Minimal header", "minimal"],
    ["Classic cover", "classic"],
    ["Left aligned", "split"],
  ]) {
    await page
      .getByRole("group", { name: "Header layout", exact: true })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    await expect(preview).toHaveClass(new RegExp(`header-${id}`));
  }
  const identity = await preview
    .locator(".profile-identity")
    .evaluate((el) => getComputedStyle(el).display);
  expect(identity).toBe("block");

  for (const [name, id] of [
    ["Compact rows", "compact"],
    ["Stacked", "stacked"],
    ["Two columns", "grid"],
  ]) {
    await page
      .getByRole("group", { name: "Button layout", exact: true })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    await expect(preview).toHaveClass(new RegExp(`links-${id}`));
  }
  const columns = await preview
    .locator(".profile-links")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" "));
  expect(columns).toHaveLength(2);

  for (const [name, id] of [
    ["Solid", "solid"],
    ["Soft gradient", "gradient"],
    ["Dotted", "dots"],
    ["Fine grid", "grid"],
  ]) {
    await page
      .getByRole("group", { name: "Background style", exact: true })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    await expect(preview).toHaveClass(new RegExp(`background-${id}`));
    if (id !== "solid")
      expect(
        await preview.evaluate((el) => getComputedStyle(el).backgroundImage),
      ).not.toBe("none");
  }
  await page.getByLabel("Font family").selectOption("manrope");
  await expect(preview).toHaveCSS("font-family", /Manrope/);
  await page.getByLabel("Corner radius", { exact: false }).fill("24");
  for (const name of ["Filled", "Outline", "Soft", "Elevated"]) {
    await choose("Button style", name);
    await expect(preview).toHaveClass(
      new RegExp(`button-${name.toLowerCase()}`),
    );
  }
  for (const [name, id] of [
    ["Circle", "circle"],
    ["Outlined icons", "outline"],
    ["Minimal icons", "minimal"],
    ["Rounded square", "rounded"],
  ]) {
    await page
      .getByRole("group", { name: "Icon style", exact: true })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    await expect(preview).toHaveClass(new RegExp(`icon-${id}`));
  }
  await expect(preview.locator(".profile-socials a").first()).toHaveCSS(
    "border-radius",
    "8px",
  );
  await page.getByLabel("Header start color", { exact: true }).fill("#123456");
  await page.getByLabel("Background", { exact: true }).fill("#123456");
  await page.getByLabel("Text color", { exact: true }).fill("#fedcba");
  await expect(preview).toHaveCSS("background-color", "rgb(18, 52, 86)");
  await expect(preview.locator(".profile-name")).toHaveCSS(
    "color",
    "rgb(254, 220, 186)",
  );
  await expect(preview.locator(".profile-cover")).toHaveCSS(
    "background-image",
    /rgb\(18, 52, 86\)/,
  );
  await page.evaluate(() => {
    document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: "test-results/design-desktop.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  await page.goto(`/editor/${saved.id}`);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await expect(page.getByLabel("Font family")).toHaveValue("manrope");
  await expect(
    page.getByLabel("Header start color", { exact: true }),
  ).toHaveValue("#123456");
  await expect(preview).toHaveClass(
    /header-split links-grid background-grid icon-rounded/,
  );
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveClass(
    /button-elevated header-split links-grid background-grid icon-rounded/,
  );
  await page.reload();
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  await expect(page.locator(".public-card-wrap .profile-name")).toHaveCSS(
    "color",
    "rgb(254, 220, 186)",
  );
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveClass(
    /button-elevated header-split links-grid background-grid icon-rounded/,
  );
  expect(errors).toEqual([]);
});

test("design choices remain usable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/editor?type=menu&sample=1");
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page
    .getByRole("group", { name: "Template", exact: true })
    .getByRole("button", { name: "Elegant", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Color palette presets", exact: true })
    .getByRole("button", { name: "Warm Sunset", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Icon style", exact: true })
    .getByRole("button", { name: /^Outlined icons/ })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "View live preview", exact: false })
    .click();
  await expect(page.locator(".preview-panel .profile-card")).toHaveClass(
    /header-centered/,
  );
  await expect(page.locator(".preview-panel .profile-menu-item")).toHaveCount(
    2,
  );
  await page.evaluate(() => {
    document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: "test-results/design-mobile.png",
    fullPage: true,
  });
});
