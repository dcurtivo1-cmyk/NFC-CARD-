import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createDocument } from "../../src/data/presets.js";

test("an online visit saves the profile and photos for offline reopening and contact download", async ({
  page,
  context,
  request,
}) => {
  const id = `fl-${crypto.randomUUID()}`;
  const document = createDocument("card", true);
  await context.addInitScript(() => {
    AbortSignal.any = undefined;
    AbortSignal.timeout = undefined;
  });
  const headers = { Authorization: `Bearer ${"c".repeat(64)}` };
  expect(
    (await request.put(`/api/pages/${id}`, { headers, data: document })).ok(),
  ).toBeTruthy();
  await page.goto(`/p/${id}`);
  await expect(page.locator(".profile-name")).toHaveText("Alex Morgan");
  await expect(page.getByRole("status")).toHaveText(
    "Available offline on this device.",
    { timeout: 30_000 },
  );
  await page.close();

  await context.setOffline(true);
  const offline = await context.newPage();
  await offline.goto(`/p/${id}`);
  await expect(offline.locator(".profile-name")).toHaveText("Alex Morgan");
  await expect(offline.getByRole("status")).toContainText(
    "Offline — showing saved info.",
  );
  await expect(offline.locator(".profile-avatar")).toBeVisible();
  expect(
    await offline
      .locator(".profile-avatar")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  const downloaded = offline.waitForEvent("download");
  await offline
    .getByRole("button", { name: "Save contact", exact: true })
    .click();
  const contact = await downloaded;
  expect(contact.suggestedFilename()).toBe("Alex-Morgan.vcf");
  expect(await readFile(await contact.path(), "utf8")).toContain(
    "FN:Alex Morgan\r\n",
  );
  await expect(
    offline.locator(".site-header, .site-footer, .public-toolbar"),
  ).toHaveCount(0);

  await offline.goto(`/p/fl-${crypto.randomUUID()}`);
  await expect(
    offline.getByText(/This page is not saved for offline use on this device/),
  ).toBeVisible();

  // Going online refreshes the saved snapshot instead of trapping an old version.
  await context.setOffline(false);
  document.details.fullName = "Alex Updated";
  document.details.displayName = "Alex Updated";
  expect(
    (await request.put(`/api/pages/${id}`, { headers, data: document })).ok(),
  ).toBeTruthy();
  await offline.goto(`/p/${id}`);
  await expect(offline.locator(".profile-name")).toHaveText("Alex Updated");
  await expect(offline.getByRole("status")).toHaveText(
    "Available offline on this device.",
  );
  await context.setOffline(true);
  await offline.reload();
  await expect(offline.locator(".profile-name")).toHaveText("Alex Updated");

  // A confirmed deletion must clear the visitor's cached snapshot.
  await context.setOffline(false);
  expect(
    (await request.delete(`/api/pages/${id}`, { headers })).ok(),
  ).toBeTruthy();
  await offline.reload();
  await expect(
    offline.getByRole("heading", { name: "This little page isn’t here yet." }),
  ).toBeVisible();
  await context.setOffline(true);
  await offline.reload();
  await expect(
    offline.getByText(/This page is not saved for offline use on this device/),
  ).toBeVisible();
});
