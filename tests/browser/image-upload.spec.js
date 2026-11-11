import { test, expect } from "@playwright/test";

test("logo transparency and white artwork survive crop, save, publishing and print export", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/editor?type=card&sample=1");
  const source = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d");
    context.fillStyle = "rgba(255, 0, 0, 0.5)";
    context.fillRect(16, 16, 32, 32);
    context.fillStyle = "white";
    context.fillRect(24, 24, 16, 16);
    return canvas.toDataURL("image/png");
  });
  await page.getByLabel("Upload business logo", { exact: true }).setInputFiles({
    name: "transparent-logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(source.split(",")[1], "base64"),
  });
  const crop = page.locator(".crop-preview canvas");
  await expect(
    page.getByRole("button", { name: "Use this image", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Zoom", { exact: true }).fill("1.2");
  await page.getByLabel("Horizontal position", { exact: true }).fill("40");
  await expect
    .poll(() =>
      crop.evaluate(
        (canvas) => canvas.getContext("2d").getImageData(0, 0, 1, 1).data[3],
      ),
    )
    .toBe(0);
  await page.getByLabel("Zoom", { exact: true }).fill("1");
  await page.getByLabel("Horizontal position", { exact: true }).fill("50");
  await page
    .getByRole("button", { name: "Use this image", exact: true })
    .click();
  const logo = await page
    .getByAltText("Business logo preview")
    .getAttribute("src");
  expect(logo).toMatch(/^data:image\/png/);
  const pixels = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return [
      [0, 0],
      [160, 160],
      [256, 256],
    ].map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data));
  }, logo);
  expect(pixels[0][3]).toBe(0);
  expect(pixels[1][3]).toBe(128);
  expect(pixels[2]).toEqual([255, 255, 255, 255]);
  await expect(page.locator(".preview-panel .profile-logo")).toHaveAttribute(
    "src",
    logo,
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.details.logo).toBe(logo);
  await page.goto(`/editor/${saved.id}`);
  await expect(page.getByAltText("Business logo preview")).toHaveAttribute(
    "src",
    logo,
  );
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const published = await page.request.get(`/api/pages/${saved.id}`);
  expect((await published.json()).document.details.logo).toBe(logo);
  await page.getByRole("button", { name: "Midnight", exact: true }).click();
  await expect(
    page.locator('.physical-card-artwork image[aria-label="Business logo"]'),
  ).toHaveAttribute("href", logo);
  const printed = await page
    .locator(".physical-card-artwork")
    .evaluate(async (svg) => {
      const { physicalCardBlob } = await import("/src/lib/physical-card.js");
      const blob = await physicalCardBlob(svg, "svg");
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 916;
        canvas.height = 600;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, 916, 600);
        // Artwork includes 3 mm bleed. Sample the logo's transparent edge and white center.
        const logo = svg.querySelector("image");
        const x = (Number(logo.getAttribute("x")) + 3) * 10;
        const y = (Number(logo.getAttribute("y")) + 3) * 10;
        const size = Number(logo.getAttribute("width")) * 10;
        return {
          corner: Array.from(context.getImageData(x + 10, y + 10, 1, 1).data),
          center: Array.from(
            context.getImageData(x + size / 2, y + size / 2, 1, 1).data,
          ),
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  expect(printed.corner).toEqual([21, 30, 48, 255]);
  expect(printed.center).toEqual([255, 255, 255, 255]);
});

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
        : /^data:image\/png/,
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
