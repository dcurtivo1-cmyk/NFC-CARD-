import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createDocument } from "../../src/data/presets.js";

test("physical card follows edits and saved drafts on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/editor?type=card&sample=1");
  const card = page.getByRole("region", { name: "Custom physical NFC card" });
  await page
    .getByLabel("Full name", { exact: false })
    .fill("Maria Clara Santos");
  await page.getByLabel("Display name", { exact: true }).fill("Maria");
  await page
    .getByLabel("Position / title", { exact: true })
    .fill("Creative Director");
  await page
    .getByRole("button", { name: "Physical NFC card", exact: true })
    .first()
    .click();
  await expect(card).toBeVisible();
  await expect(page.locator(".preview-stage")).toBeHidden();
  const templates = card.getByRole("group", { name: "Choose a card template" });
  for (const [name, id] of [
    ["Classic", "classic"],
    ["Midnight", "midnight"],
    ["Minimal", "minimal"],
    ["Split", "split"],
    ["Wave", "wave"],
    ["Outline", "outline"],
  ]) {
    await templates.getByRole("button", { name, exact: true }).click();
    await expect(
      templates.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator(".physical-card-artwork")).toHaveAttribute(
      "data-template",
      id,
    );
  }
  await templates.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(card.locator(".physical-card-artwork")).toContainText(
    "Maria Clara Santos",
  );
  await expect(card.locator(".physical-card-artwork")).toContainText(
    "Creative Director",
  );
  await expect(
    card.getByRole("button", { name: "Download front SVG" }),
  ).toBeDisabled();
  await expect(card.locator("svg svg")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page.getByLabel("Background", { exact: true }).fill("#123456");
  await expect(
    card.locator(".physical-card-artwork > rect").first(),
  ).toHaveAttribute("fill", "#123456");
  await templates.getByRole("button", { name: "Outline", exact: true }).click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  await page.goto(`/editor/${saved.id}`);
  await page
    .getByRole("group", { name: "Preview type" })
    .getByRole("button", { name: "Physical NFC card", exact: true })
    .click();
  await expect(card.locator(".physical-card-artwork")).toContainText(
    "Maria Clara Santos",
  );
  await expect(card.locator(".physical-card-artwork")).toHaveAttribute(
    "data-template",
    "outline",
  );
  await expect(
    templates.getByRole("button", { name: "Outline", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: "test-results/physical-card-mobile.png" });
});

test("published physical cards export both sides with embedded logo, bleed and matching QR", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const doc = {
    ...createDocument("card", true),
    id: `fl-${crypto.randomUUID()}`,
    status: "generated",
    publishedAt: new Date().toISOString(),
    publishedUrl: "https://example.com/p/physical-card-test",
  };
  doc.details.fullName = "Maria & Clara Santos";
  doc.details.logo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=";
  await page.goto("/");
  await page.evaluate((doc) => {
    localStorage.setItem("folio-studio-documents-v1", JSON.stringify([doc]));
    localStorage.setItem(
      "folio-studio-publish-keys-v1",
      JSON.stringify({ [doc.id]: "test-owner-key" }),
    );
  }, doc);
  await page.route(`**/api/pages/${doc.id}`, (route) =>
    route.fulfill({ json: { document: doc } }),
  );
  await page.goto(`/p/${doc.id}?manage=1`);
  await page.getByRole("button", { name: "Share & QR", exact: true }).click();
  const card = page.getByRole("region", { name: "Custom physical NFC card" });
  const qrPath = await page
    .locator(".share-qr svg path")
    .last()
    .getAttribute("d");
  expect(await card.locator("svg svg path").last().getAttribute("d")).toBe(
    qrPath,
  );
  await card.getByRole("button", { name: "Midnight", exact: true }).click();
  for (const side of ["front", "back"]) {
    await card
      .getByRole("button", {
        name: side === "front" ? "Front" : "Back",
        exact: true,
      })
      .click();
    const downloaded = page.waitForEvent("download");
    await card.getByRole("button", { name: `Download ${side} SVG` }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(
      `folio-${doc.id}-card-${side}.svg`,
    );
    const svg = await readFile(await download.path(), "utf8");
    expect(svg).toContain('width="91.6mm"');
    expect(svg).toContain('height="59.98mm"');
    expect(svg).toContain('viewBox="-3 -3 91.6 59.98"');
    expect(svg).toContain('data-template="midnight"');
    expect(svg).toContain('fill="#151e30"');
    expect(svg).toContain("Maria &amp; Clara Santos");
    expect(svg).toContain(doc.details.logo);
    expect(svg).toContain(qrPath);
    expect(svg).toContain("NFC tap icon");
    expect(svg).not.toContain("QR after");
  }
  const downloaded = page.waitForEvent("download");
  await card.getByRole("button", { name: "Download back PNG" }).click();
  const png = await readFile(await (await downloaded).path());
  expect(png.readUInt32BE(16)).toBe(2164);
  expect(png.readUInt32BE(20)).toBe(1417);
  await card.getByRole("button", { name: "Front", exact: true }).click();
  await card.screenshot({ path: "test-results/physical-card-desktop.png" });
  expect(errors).toEqual([]);
});

test("physical template survives digital theme changes, publishing and saving from Share", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/editor?type=card&sample=1");
  await page
    .getByRole("button", { name: "Physical NFC card", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await page
    .getByRole("button", { name: "Make it yours", exact: true })
    .last()
    .click();
  await page
    .getByRole("group", { name: "Template", exact: true })
    .getByRole("button", { name: "Elegant", exact: true })
    .click();
  await expect(page.locator(".physical-card-artwork")).toHaveAttribute(
    "data-template",
    "split",
  );
  await page.getByRole("button", { name: "Final look", exact: false }).click();
  await page
    .getByRole("button", { name: "Generate my demo", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal.locator(".physical-card-artwork")).toHaveAttribute(
    "data-template",
    "split",
  );
  await modal.getByRole("button", { name: "Wave", exact: true }).click();
  await modal
    .getByRole("button", { name: "Save card design", exact: true })
    .click();
  await expect(
    modal.getByRole("button", { name: "Save card design", exact: true }),
  ).toHaveCount(0);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-studio-documents-v1"))[0],
  );
  expect(saved.design.physicalTemplate).toBe("wave");
  await page.reload();
  await page.getByRole("button", { name: "Share & QR", exact: true }).click();
  await expect(modal.locator(".physical-card-artwork")).toHaveAttribute(
    "data-template",
    "wave",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.goto(`/editor/${saved.id}`);
  await page
    .getByRole("button", { name: "Physical NFC card", exact: true })
    .first()
    .click();
  await expect(page.locator(".physical-card-artwork")).toHaveAttribute(
    "data-template",
    "wave",
  );
});
