import { test, expect } from "@playwright/test";

test("uploads multiple image formats, handles missing MIME types, and rejects unreadable files", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/editor?type=card");

  const bitmap = Buffer.alloc(58);
  bitmap.write("BM");
  bitmap.writeUInt32LE(58, 2);
  bitmap.writeUInt32LE(54, 10);
  bitmap.writeUInt32LE(40, 14);
  bitmap.writeInt32LE(1, 18);
  bitmap.writeInt32LE(1, 22);
  bitmap.writeUInt16LE(1, 26);
  bitmap.writeUInt16LE(24, 28);
  bitmap.writeUInt32LE(4, 34);
  bitmap.set([32, 128, 224], 54);

  const files = [
    {
      label: "profile photo",
      preview: "Profile photo preview",
      name: "photo.gif",
      mimeType: "image/gif",
      buffer: Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64",
      ),
    },
    {
      label: "business logo",
      preview: "Business logo preview",
      name: "logo.bmp",
      mimeType: "image/bmp",
      buffer: bitmap,
    },
    {
      label: "profile photo",
      preview: "Profile photo preview",
      name: "portrait.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#7456e8"/></svg>',
      ),
    },
    {
      label: "business logo",
      preview: "Business logo preview",
      name: "image.unknown",
      mimeType: "",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=",
        "base64",
      ),
    },
  ];

  for (const file of files) {
    const input = page.getByLabel(`Upload ${file.label}`, { exact: true });
    await expect(input).toHaveAttribute("accept", "image/*");
    await input.setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    });
    await expect(
      page.getByRole("button", { name: "Use this image", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Use this image", exact: true })
      .click();
    await expect(page.getByAltText(file.preview)).toHaveAttribute(
      "src",
      file.label === "profile photo"
        ? /^data:image\/(webp|png)/
        : /^data:image\/jpeg/,
    );
  }

  const originalLogo = await page
    .getByAltText("Business logo preview")
    .getAttribute("src");
  await page.getByLabel("Upload business logo", { exact: true }).setInputFiles({
    name: "broken.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("This is not an image."),
  });
  await expect(
    page.getByText("This file could not be decoded as an image.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByAltText("Business logo preview")).toHaveAttribute(
    "src",
    originalLogo,
  );

  await page.getByLabel("Upload business logo", { exact: true }).setInputFiles({
    name: "large.bmp",
    mimeType: "image/bmp",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(
    page.getByText("Please choose an image smaller than 5 MB.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByAltText("Business logo preview")).toHaveAttribute(
    "src",
    originalLogo,
  );
  expect(errors).toEqual([]);
});
