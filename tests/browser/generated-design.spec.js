import { test, expect } from "@playwright/test";
import { createDocument, themes } from "../../src/data/presets.js";

// Compare the same viewport width: a wider phone may naturally wrap differently,
// but moving from the editor to a generated page must not restyle its contents.
async function appearance(card) {
  return card.evaluate((root) => {
    const origin = root.getBoundingClientRect();
    const selectors = [
      ".profile-cover",
      ".profile-portrait",
      ".profile-content",
      ".profile-identity",
      ".profile-avatar",
      ".profile-name",
      ".profile-position",
      ".profile-bio",
      ".profile-socials",
      ".profile-button",
      ".profile-contact",
      ".profile-contact > a",
    ];
    return selectors.flatMap((selector) =>
      [...root.querySelectorAll(selector)].map((node) => {
        const rect = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        return {
          selector,
          text: node.textContent,
          box:
            css.display === "none"
              ? null
              : [
                  rect.x - origin.x,
                  rect.y - origin.y + root.scrollTop,
                  rect.width,
                  rect.height,
                ].map((n) => Math.round(n * 10) / 10),
          style: Object.fromEntries(
            [
              "fontFamily",
              "fontSize",
              "fontWeight",
              "lineHeight",
              "color",
              "backgroundColor",
              "backgroundImage",
              "borderRadius",
              "padding",
              "margin",
              "display",
              "gap",
              "gridTemplateColumns",
            ].map((key) => [key, css[key]]),
          ),
        };
      }),
    );
  });
}

for (const mobile of [false, true]) {
  test(`generated designs match the editor in ${mobile ? "mobile circle" : "desktop portrait"} mode`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    if (mobile) await page.setViewportSize({ width: 360, height: 800 });
    const visitor = await browser.newContext({
      viewport: mobile
        ? { width: 360, height: 800 }
        : { width: 1440, height: 1000 },
    });
    const publicPage = await visitor.newPage();
    try {
      await page.goto("/");
      const documents = themes.map((theme) => {
        const document = createDocument("card", true);
        document.id = `fl-${crypto.randomUUID()}`;
        document.design = {
          ...theme,
          photoStyle: mobile ? "circle" : "portrait",
          portraitSize: 87,
          portraitX: 9,
          portraitY: 4,
        };
        if (mobile) {
          document.details.bio = "";
          document.details.position = "";
          document.details.businessName = "";
        }
        return document;
      });
      await page.evaluate(
        (documents) =>
          localStorage.setItem(
            "folio-studio-documents-v1",
            JSON.stringify(documents),
          ),
        documents,
      );
      for (const document of documents) {
        await page.goto(`/editor/${document.id}`);
        const preview = page.locator(".preview-panel .profile-card");
        await expect(preview.locator(".profile-name")).toHaveText(
          "Alex Morgan",
        );
        await page.evaluate(() => document.fonts.ready);
        const width = await preview.evaluate(
          (el) => el.getBoundingClientRect().width,
        );
        const before = await appearance(preview);
        await page
          .getByRole("button", { name: "Final look", exact: false })
          .click();
        await page
          .getByRole("button", { name: "Generate my demo", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Close dialog", exact: true })
          .click();
        await page.addStyleTag({
          content: `.public-card-wrap { width: ${width}px !important; border: 0 !important; }`,
        });
        expect(
          await appearance(page.locator(".public-card-wrap .profile-card")),
          `${document.design.name} management view`,
        ).toEqual(before);
        await publicPage.goto(`/p/${document.id}`);
        const published = publicPage.locator(".public-card-wrap .profile-card");
        await expect(published.locator(".profile-name")).toHaveText(
          "Alex Morgan",
        );
        await publicPage.evaluate(() => document.fonts.ready);
        await publicPage.addStyleTag({
          content: `.public-card-wrap { width: ${width}px !important; }`,
        });
        expect(
          await appearance(published),
          `${document.design.name} visitor view`,
        ).toEqual(before);
      }
    } finally {
      await visitor.close();
    }
  });
}
