import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChrome =
  process.platform === "win32" &&
  existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : undefined;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5180",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || systemChrome,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5180 --strictPort",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
    env: { FOLIO_LOCAL_PUBLISHING: "1" },
    timeout: 30_000,
  },
});
