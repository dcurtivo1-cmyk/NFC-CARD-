import { test, expect } from "@playwright/test";
import { themes } from "../../src/data/presets.js";

test("20 templates have distinct geometry even in the same palette and persist to a public page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/editor?type=card&sample=1");
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  const gallery = page.getByRole("group", { name: "Template", exact: true });
  await expect(gallery.getByRole("button")).toHaveCount(20);
  await expect
    .poll(() =>
      gallery.locator(".template-preview").evaluateAll((previews) =>
        previews.every((preview) => {
          const outer = preview.getBoundingClientRect();
          const inner = preview.firstElementChild.getBoundingClientRect();
          return (
            inner.left >= outer.left &&
            inner.right <= outer.right + 1 &&
            inner.bottom <= outer.bottom + 1
          );
        }),
      ),
    )
    .toBe(true);
  await gallery.screenshot({ path: "test-results/template-gallery.png" });
  const card = page.locator(".preview-panel .profile-card");
  const geometries = [];
  for (const theme of themes) {
    await gallery
      .getByRole("button", { name: theme.name, exact: true })
      .click();
    await page
      .getByRole("group", { name: "Color palette presets", exact: true })
      .getByRole("button", { name: "Monochrome", exact: true })
      .click();
    await expect(card).toHaveClass(
      new RegExp(`composition-${theme.id}(?: |$)`),
    );
    await expect(card.locator(".profile-name")).toHaveText("Alex Morgan");
    if (["outline", "soft"].includes(theme.buttonStyle)) {
      await expect(card.locator(".profile-main-button")).toHaveCSS(
        "color",
        "rgb(52, 56, 61)",
      );
    }
    geometries.push(
      await card.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return [
          ".profile-cover",
          ".profile-content",
          ".profile-identity",
          ".profile-name",
          ".profile-contact",
        ].map((selector) => {
          const node = el.querySelector(selector);
          const rect = node.getBoundingClientRect();
          const css = getComputedStyle(node);
          return [
            Math.round(rect.width),
            Math.round(rect.height),
            Math.round(rect.left - box.left),
            css.borderRadius,
            css.borderLeftWidth,
            css.borderBottomStyle,
            css.fontSize,
          ];
        });
      }),
    );
    expect(
      await card.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
  }
  expect(
    new Set(geometries.map((geometry) => JSON.stringify(geometry))).size,
  ).toBe(20);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  await page.goto(`/editor/${saved.id}`);
  await expect(card).toHaveClass(/composition-architect/);
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveClass(
    /composition-architect/,
  );
  await page.reload();
  await expect(page.locator(".public-card-wrap .profile-card")).toHaveClass(
    /composition-architect/,
  );
  expect(errors).toEqual([]);
});

test("template filters and all compositions work on mobile in both photo modes and other products", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const type of ["card", "menu"]) {
    await page.goto(`/editor?type=${type}&sample=1`);
    await page
      .getByRole("button", { name: "Make it yours", exact: true })
      .last()
      .click();
    const gallery = page.getByRole("group", { name: "Template", exact: true });
    const filters = page.getByRole("group", { name: "Filter templates" });
    await filters
      .getByRole("button", { name: "Business", exact: true })
      .click();
    await expect(gallery.getByRole("button")).toHaveCount(4);
    await filters
      .getByRole("button", { name: "All (20)", exact: true })
      .click();
    for (const mode of type === "card" ? ["Circle", "Portrait"] : [null]) {
      if (mode)
        await page
          .getByRole("group", { name: "Profile photo style", exact: true })
          .getByRole("button", { name: new RegExp(`^${mode}`) })
          .click();
      for (const theme of themes) {
        await gallery
          .getByRole("button", { name: theme.name, exact: true })
          .click();
        const card = page.locator(".preview-panel .profile-card");
        await expect(card).toHaveClass(
          new RegExp(`composition-${theme.id}(?: |$)`),
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await card.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        ).toBe(true);
        if (mode === "Circle")
          await expect(card.locator(".profile-avatar")).toHaveCount(1);
        if (mode === "Portrait")
          await expect(card.locator(".profile-portrait")).toHaveCount(1);
        if (type === "menu")
          await expect(card.locator(".profile-menu-item")).toHaveCount(2);
      }
    }
  }
  await page.screenshot({
    path: "test-results/templates-mobile.png",
    fullPage: true,
  });
});
