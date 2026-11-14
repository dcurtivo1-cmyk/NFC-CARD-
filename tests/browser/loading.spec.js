import { test, expect } from "@playwright/test";
import { createDocument } from "../../src/data/presets.js";

test("the mobile landing shows a splash before JavaScript and releases it when ready", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/src/main.jsx", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  try {
    await expect(page.locator(".folio-loading")).toBeVisible();
    await expect(page.locator(".tap-phone")).toBeVisible();
    await expect(page.locator(".tap-card")).toBeVisible();
    await expect(page.locator(".tap-wave")).toHaveCount(3);
    await expect(page.locator(".loading-title")).toHaveText(
      "Opening your page…",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/loading-mobile.png" });
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Big possibilities.",
  );
  await expect(page.locator("#startup-loader")).toHaveCount(0);
  await expect(page.locator(".folio-loading")).toHaveCount(0);
});

test("a ready NFC page appears beneath the fade even with the illustration paused mid-cycle", async ({
  page,
}) => {
  const document = {
    ...createDocument("card", true),
    id: `fl-${crypto.randomUUID()}`,
    publishedAt: new Date().toISOString(),
    status: "generated",
  };
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/pages/${document.id}`, async (route) => {
    await gate;
    await route.fulfill({ json: { document } });
  });
  await page.goto(`/p/${document.id}`);
  try {
    await expect(page.locator("#root .loading-overlay")).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll("#root .tap-scene").forEach((scene) => {
        scene.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause();
          animation.currentTime = 1800;
        });
      });
      window.sawContentDuringFade = false;
      const observer = new MutationObserver(() => {
        const overlay = document.querySelector(
          "#root .loading-overlay.is-leaving",
        );
        if (
          overlay &&
          document.querySelector(".profile-landing .profile-name")
        ) {
          window.sawContentDuringFade =
            getComputedStyle(overlay).pointerEvents === "none";
          observer.disconnect();
        }
      });
      observer.observe(document.getElementById("root"), {
        childList: true,
        subtree: true,
        attributes: true,
      });
    });
    await page.screenshot({ path: "test-results/loading-signal.png" });
  } finally {
    release();
  }
  await expect(page.locator(".profile-landing .profile-name")).toBeVisible();
  expect(await page.evaluate(() => window.sawContentDuringFade)).toBe(true);
  await expect(page.locator(".folio-loading")).toHaveCount(0);
});

test("an NFC visit loads, recovers from an error, and respects reduced motion in dark mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const document = {
    ...createDocument("card", true),
    id: `fl-${crypto.randomUUID()}`,
    publishedAt: new Date().toISOString(),
    status: "generated",
  };
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let retrying = false;
  await page.route(`**/api/pages/${document.id}`, async (route) => {
    await gate;
    await route.fulfill({
      status: retrying ? 200 : 503,
      contentType: "application/json",
      body: JSON.stringify(
        retrying ? { document } : { error: "Please retry this connection." },
      ),
    });
  });
  await page.goto(`/p/${document.id}`);
  try {
    await expect(page.locator(".folio-loading")).toBeVisible();
    await expect(page.locator("#root .tap-card")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".folio-loading")).toHaveCSS(
      "background-color",
      "rgb(29, 30, 40)",
    );
    await page.screenshot({ path: "test-results/loading-dark.png" });
  } finally {
    release();
  }
  await expect(page.getByText("Please retry this connection.")).toBeVisible();
  await expect(page.locator(".folio-loading")).toHaveCount(0);
  retrying = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".profile-landing .profile-name")).toBeVisible();
  await expect(page.locator(".folio-loading")).toHaveCount(0);
  await expect(page.locator(".public-card-wrap")).toHaveCSS(
    "animation-name",
    "none",
  );
});
