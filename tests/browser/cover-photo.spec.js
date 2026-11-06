import { test, expect } from "@playwright/test";

test("cover photos crop, replace, persist and render across header layouts", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/editor?type=card&sample=1");
  const input = page.getByLabel("Upload cover photo", { exact: true });
  await expect(input).toHaveAttribute("accept", "image/*");
  const upload = async (color) => {
    await input.setInputFiles({
      name: "cover.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect width="900" height="300" fill="${color}"/><circle cx="450" cy="150" r="110" fill="#f6d8c4"/></svg>`,
      ),
    });
    await expect(
      page.getByRole("dialog", { name: "Crop your cover photo", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".crop-preview canvas")).toHaveAttribute(
      "width",
      "1200",
    );
    await expect(page.locator(".crop-preview canvas")).toHaveAttribute(
      "height",
      "400",
    );
    await page.getByLabel("Zoom", { exact: true }).fill("1.25");
    await page
      .getByRole("button", { name: "Use this image", exact: true })
      .click();
  };
  await upload("#3269d5");
  const image = page.locator(".preview-panel .profile-cover-photo");
  await expect(image).toBeVisible();
  const first = await image.getAttribute("src");
  expect(
    await image.evaluate((el) => [el.naturalWidth, el.naturalHeight]),
  ).toEqual([1200, 400]);
  await expect(page.locator(".preview-panel .cover-orbit")).toHaveCount(0);
  await upload("#376953");
  const photo = await image.getAttribute("src");
  expect(photo).not.toBe(first);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  for (const name of [
    "Classic cover",
    "Centered",
    "Side by side",
    "Minimal header",
  ]) {
    await page
      .getByRole("group", { name: "Header layout", exact: true })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", photo);
  }
  await expect(page.locator(".preview-panel .profile-cover")).toHaveCSS(
    "height",
    "116px",
  );
  await page.getByRole("button", { name: "Warm Sunset", exact: true }).click();
  await expect(image).toHaveAttribute("src", photo);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.details.coverPhoto).toBe(photo);
  await page.goto("/dashboard");
  await expect(page.locator(".mini-cover-photo")).toHaveAttribute("src", photo);
  await page.getByRole("link", { name: "Edit page", exact: true }).click();
  await expect(image).toHaveAttribute("src", photo);
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const url = page.url();
  await page.reload();
  await expect(
    page.locator(".public-card-wrap .profile-cover-photo"),
  ).toHaveAttribute("src", photo);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Edit page", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove cover photo", exact: true })
    .click();
  await expect(image).toHaveCount(0);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page
    .getByRole("group", { name: "Header layout", exact: true })
    .getByRole("button", { name: /^Classic cover/ })
    .click();
  await expect(page.locator(".preview-panel .cover-orbit")).toHaveCount(2);
  await expect(page.locator(".preview-panel .profile-cover")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.goto(url);
  await expect(
    page.locator(".public-card-wrap .profile-cover-photo"),
  ).toHaveCount(0);
  await expect(page.locator(".public-card-wrap .profile-cover")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
});
