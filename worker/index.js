import { handlePagesApi } from "../server/pages-api.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/"))
      return handlePagesApi(request, env.DB);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });
    let asset = FOLIO_ASSETS[url.pathname];
    if (!asset && !/\.[a-z\d]+$/i.test(url.pathname))
      asset = FOLIO_ASSETS["/index.html"];
    if (!asset) return new Response("Not found", { status: 404 });
    const bytes = Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0));
    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "Content-Type": asset.type,
        "Cache-Control": url.pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  },
};
