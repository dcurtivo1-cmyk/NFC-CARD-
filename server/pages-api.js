import { normalizeDocument } from "../src/lib/storage.js";
import { validateDetails } from "../src/lib/profile.js";

export const MAX_PAGE_BYTES = 1_500_000;
const idPattern = /^fl-[a-f0-9-]{36}$/i;
const tokenPattern = /^[a-f0-9]{64}$/;
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

async function hash(value) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PAGE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// The database stores only public snapshots and a hash of the private edit key.
// Conditional writes prevent a guessed ID or concurrent creation from claiming a page.
export async function handlePagesApi(request, db) {
  const url = new URL(request.url);
  const match = /^\/api\/pages\/([^/]+)$/.exec(url.pathname);
  if (!match || !idPattern.test(match[1]))
    return json({ error: "Page not found." }, 404);
  if (!db)
    return json(
      {
        error:
          "Publishing is not configured on this host. Your draft is saved; ask the site owner to enable persistent storage.",
      },
      503,
    );
  const id = match[1];
  try {
    if (request.method === "GET") {
      const row = await db
        .prepare("SELECT document FROM published_pages WHERE id = ?")
        .bind(id)
        .first();
      return row
        ? json({ document: JSON.parse(row.document) })
        : json(
            { error: "This page has not been published or has been deleted." },
            404,
          );
    }
    if (!["PUT", "DELETE"].includes(request.method)) {
      const response = json({ error: "Method not allowed." }, 405);
      response.headers.set("Allow", "GET, PUT, DELETE");
      return response;
    }
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin)
      return json({ error: "Request origin is not allowed." }, 403);
    const token = (request.headers.get("Authorization") || "").replace(
      /^Bearer /,
      "",
    );
    if (!tokenPattern.test(token))
      return json(
        { error: "The private edit key is missing or invalid." },
        401,
      );
    const tokenHash = await hash(token);
    if (request.method === "DELETE") {
      const row = await db
        .prepare("SELECT token_hash FROM published_pages WHERE id = ?")
        .bind(id)
        .first();
      if (row && row.token_hash !== tokenHash)
        return json({ error: "You cannot delete this page." }, 403);
      await db
        .prepare("DELETE FROM published_pages WHERE id = ? AND token_hash = ?")
        .bind(id, tokenHash)
        .run();
      return json({ deleted: true });
    }
    if (!request.headers.get("Content-Type")?.startsWith("application/json"))
      return json({ error: "Send page data as JSON." }, 415);
    let value;
    try {
      value = await readBody(request);
    } catch {
      return json({ error: "Invalid page data." }, 400);
    }
    if (value === null)
      return json(
        {
          error:
            "This page is too large to publish. Use smaller photos and try again (1.5 MB maximum).",
        },
        413,
      );
    const document = normalizeDocument(value);
    if (
      !document ||
      Object.keys(validateDetails(document.details, document.type)).length
    )
      return json(
        {
          error: "Please complete the required page details before publishing.",
        },
        400,
      );
    for (const field of [
      "profilePhoto",
      "logo",
      "coverPhoto",
      "showcaseImage",
    ]) {
      const image = document.details[field];
      if (
        image &&
        !/^data:image\/(jpeg|png|webp|gif);base64,[a-z\d+/=\s]+$/i.test(
          image,
        ) &&
        !/^https:\/\//i.test(image) &&
        image !== "/alex-portrait.svg"
      ) {
        return json(
          { error: "Use an uploaded image or an HTTPS image URL." },
          400,
        );
      }
    }
    const timestamp = new Date().toISOString();
    const published = {
      id,
      type: document.type,
      status: "generated",
      details: document.details,
      design: document.design,
      publishedAt: timestamp,
      updatedAt: timestamp,
    };
    const result = await db
      .prepare(
        `INSERT INTO published_pages (id, token_hash, document) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET document = excluded.document
      WHERE published_pages.token_hash = excluded.token_hash`,
      )
      .bind(id, tokenHash, JSON.stringify(published))
      .run();
    if (!result.meta.changes)
      return json(
        {
          error:
            "This page belongs to a different editor. Duplicate it to publish your own copy.",
        },
        403,
      );
    return json({ document: published });
  } catch (error) {
    console.error("Profile storage request failed:", error.message);
    return json(
      {
        error:
          "Publishing storage is temporarily unavailable. Your local work is safe; please try again.",
      },
      503,
    );
  }
}
