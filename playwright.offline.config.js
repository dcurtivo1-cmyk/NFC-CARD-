import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

export default defineConfig({
  ...base,
  testDir: "./tests/offline",
  timeout: 60_000,
  use: { ...base.use, baseURL: "http://127.0.0.1:5182" },
  webServer: {
    command: "npm run preview -- --port 5182 --strictPort",
    url: "http://127.0.0.1:5182",
    reuseExistingServer: false,
    env: { FOLIO_LOCAL_PUBLISHING: "1" },
    timeout: 30_000,
  },
});
