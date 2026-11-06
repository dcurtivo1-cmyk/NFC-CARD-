import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, extname, dirname } from "node:path";

const require = createRequire(import.meta.url);
const vite = resolve(
  dirname(require.resolve("vite/package.json")),
  "bin/vite.js",
);
const result = spawnSync(
  process.execPath,
  [vite, "build", "--configLoader", "native"],
  { stdio: "inherit", windowsHide: true },
);
if (result.status !== 0) process.exit(result.status || 1);
const { build } = await import("esbuild");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};
const assets = {};
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["server", ".openai"].includes(entry.name)) continue;
    const filename = resolve(directory, entry.name);
    if (entry.isDirectory()) collect(filename);
    else
      assets[`/${relative("dist", filename).replaceAll("\\", "/")}`] = {
        body: readFileSync(filename).toString("base64"),
        type: types[extname(filename)] || "application/octet-stream",
      };
  }
}
collect(resolve("dist"));
const shellUrls = Object.keys(assets).filter((path) =>
  /\.(html|js|css|svg|png)$/.test(path),
);
const shellVersion = createHash("sha256")
  .update(JSON.stringify(assets))
  .digest("hex")
  .slice(0, 16);
const serviceWorker = `const SHELL_CACHE = "folio-shell-${shellVersion}";\nconst SHELL_URLS = ${JSON.stringify(shellUrls)};\n${readFileSync("server/offline-worker.js", "utf8")}`;
writeFileSync("dist/sw.js", serviceWorker);
assets["/sw.js"] = {
  body: Buffer.from(serviceWorker).toString("base64"),
  type: "text/javascript; charset=utf-8",
};
await build({
  entryPoints: ["worker/index.js"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  banner: { js: `const FOLIO_ASSETS = ${JSON.stringify(assets)};` },
});
mkdirSync("dist/.openai", { recursive: true });
copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");
console.log("Built NFC publishing Worker with embedded site assets.");
