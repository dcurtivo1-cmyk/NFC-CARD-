import { Readable } from "node:stream";
import { openLocalDatabase } from "./local-db.js";
import { handlePagesApi } from "./pages-api.js";

export function publishingApi() {
  function configure(server) {
    const db = openLocalDatabase();
    server.httpServer?.once("close", () => db.close());
    server.middlewares.use(async (req, res, next) => {
      if (!req.url.startsWith("/api/")) return next();
      try {
        const request = new Request(`http://${req.headers.host}${req.url}`, {
          method: req.method,
          headers: req.headers,
          ...(["GET", "HEAD"].includes(req.method)
            ? {}
            : { body: Readable.toWeb(req), duplex: "half" }),
        });
        const response = await handlePagesApi(request, db);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Could not complete the publishing request.",
          }),
        );
      }
    });
  }
  return {
    name: "folio-publishing-api",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}
