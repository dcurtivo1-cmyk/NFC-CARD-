import { test, expect } from "@playwright/test";

test("showcase upload crops to landscape and persists through draft, profile and removal", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/editor?type=card&sample=1");
  const input = page.getByLabel("Upload showcase image", { exact: true });
  await expect(input).toHaveAttribute("accept", "image/*");
  const photo = {
    name: "showcase.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#7456e8"/><circle cx="80" cy="45" r="30" fill="#f6d8c4"/></svg>',
    ),
  };
  await input.setInputFiles(photo);
  await expect(
    page.getByRole("dialog", { name: "Crop your showcase image", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".crop-preview canvas")).toHaveAttribute(
    "width",
    "1024",
  );
  await expect(page.locator(".crop-preview canvas")).toHaveAttribute(
    "height",
    "576",
  );
  await page.getByLabel("Zoom", { exact: true }).fill("1.5");
  await page
    .getByRole("button", { name: "Use this image", exact: true })
    .click();
  await page
    .getByLabel("Showcase caption", { exact: true })
    .fill("Our latest brand project");
  const preview = page.locator(".preview-panel .profile-showcase");
  await expect(
    preview.getByAltText("Our latest brand project", { exact: true }),
  ).toBeVisible();
  await expect(preview.locator("figcaption")).toHaveText(
    "Our latest brand project",
  );
  const image = await preview.locator("img").getAttribute("src");
  expect(image).toMatch(/^data:image\/jpeg/);
  expect(
    await preview
      .locator("img")
      .evaluate((el) => [el.naturalWidth, el.naturalHeight]),
  ).toEqual([1024, 576]);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.details.showcaseImage).toBe(image);
  await page.goto(`/editor/${saved.id}`);
  await expect(
    page.getByLabel("Showcase caption", { exact: true }),
  ).toHaveValue("Our latest brand project");
  await expect(preview.locator("img")).toHaveAttribute("src", image);
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const url = page.url();
  await expect(
    page.locator(".public-card-wrap .profile-showcase img"),
  ).toHaveAttribute("src", image);
  await page.reload();
  await expect(
    page.locator(".public-card-wrap .profile-showcase figcaption"),
  ).toHaveText("Our latest brand project");
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Edit page", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove showcase image", exact: true })
    .click();
  await expect(preview).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.goto(url);
  await expect(page.locator(".public-card-wrap .profile-showcase")).toHaveCount(
    0,
  );
});
