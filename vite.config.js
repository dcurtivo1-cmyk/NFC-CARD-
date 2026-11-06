import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const nodeRequire = createRequire(import.meta.url);

// Resolve relative dependency imports without esbuild enumerating protected
// ancestor directories on managed Windows workspaces. Bare imports still use Vite.
const workspaceDependencyResolver = {
  name: "workspace-relative-dependencies",
  setup(build) {
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.resolveDir) return;
      try {
        return {
          path: nodeRequire.resolve(resolve(args.resolveDir, args.path)),
        };
      } catch {
        return;
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    esbuildOptions: { plugins: [workspaceDependencyResolver] },
  },
});
