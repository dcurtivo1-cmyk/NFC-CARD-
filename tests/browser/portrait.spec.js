import { test, expect } from "@playwright/test";

test("portraits preserve alpha and proportions, layer over the cover, and persist placement", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  await page.goto("/editor?type=card&sample=1");
  for (const [width, height] of [
    [400, 200],
    [200, 400],
  ]) {
    const image = await page.evaluate(
      ({ width, height }) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#deaa82";
        ctx.fillRect(width * 0.4, height * 0.08, width * 0.2, height * 0.2);
        ctx.fillStyle = "#243c68";
        ctx.fillRect(width * 0.25, height * 0.28, width * 0.5, height * 0.72);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { width, height },
    );
    await page
      .getByLabel("Upload profile photo", { exact: true })
      .setInputFiles({
        name: "portrait.png",
        mimeType: "image/png",
        buffer: Buffer.from(image, "base64"),
      });
    await expect(
      page.getByRole("dialog", { name: "Preview your portrait" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Use this image", exact: true })
      .click();
    const portrait = page.locator(".preview-panel .profile-portrait");
    await expect(portrait).toBeVisible();
    expect(
      await portrait.evaluate((img) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return {
          width: img.naturalWidth,
          height: img.naturalHeight,
          alpha: ctx.getImageData(0, 0, 1, 1).data[3],
          bodyAlpha: ctx.getImageData(canvas.width / 2, canvas.height - 1, 1, 1)
            .data[3],
        };
      }),
    ).toEqual({ width, height, alpha: 0, bodyAlpha: 255 });
  }
  const portrait = page.locator(
    ".preview-panel .profile-cover > .profile-portrait",
  );
  await expect(portrait).toHaveCSS("object-fit", "contain");
  await expect(portrait).toHaveCSS("position", "absolute");
  await expect(portrait).toHaveCSS("border-radius", "0px");
  await expect(
    page.locator(
      ".preview-panel .avatar-wrap, .preview-panel .avatar-fallback, .preview-panel .avatar-badge",
    ),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page.getByLabel("Portrait size", { exact: true }).fill("110");
  await page
    .getByLabel("Portrait horizontal position", { exact: true })
    .fill("-8");
  await page
    .getByLabel("Portrait vertical position", { exact: true })
    .fill("3");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.design.portraitSize).toBe(110);
  expect(saved.design.portraitX).toBe(-8);
  expect(saved.design.portraitY).toBe(3);
  await page.goto(`/editor/${saved.id}`);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await expect(
    page.getByLabel("Portrait horizontal position", { exact: true }),
  ).toHaveValue("-8");
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  const url = await page.getByLabel("Your actual profile URL").inputValue();
  const visitor = await browser.newContext();
  try {
    const publicPage = await visitor.newPage();
    await publicPage.goto(url);
    await expect(publicPage.locator(".profile-portrait")).toHaveAttribute(
      "src",
      saved.details.profilePhoto,
    );
    for (const width of [1440, 390, 320]) {
      await publicPage.setViewportSize({ width, height: 900 });
      await expect(publicPage.locator(".profile-content")).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      const layout = await publicPage.evaluate(() => {
        const card = document.querySelector(".profile-card");
        const hero = document
          .querySelector(".profile-cover")
          .getBoundingClientRect();
        const name = document
          .querySelector(".profile-name")
          .getBoundingClientRect();
        return {
          size: card.style.getPropertyValue("--portrait-size"),
          x: card.style.getPropertyValue("--portrait-x"),
          y: card.style.getPropertyValue("--portrait-y"),
          detailsBelow: name.top >= hero.bottom,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout).toEqual({
        size: "110%",
        x: "-8%",
        y: "3%",
        detailsBelow: true,
        overflow: false,
      });
    }
    await publicPage.screenshot({
      path: "test-results/portrait-mobile.png",
      fullPage: true,
    });
  } finally {
    await visitor.close();
  }
});
