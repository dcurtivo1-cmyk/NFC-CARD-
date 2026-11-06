import { test } from "node:test";
import assert from "node:assert/strict";
import { relayPublishing } from "../server/publishing-relay.js";
import { handlePagesApi } from "../server/pages-api.js";
import { openLocalDatabase } from "../server/local-db.js";
import { createDocument } from "../src/data/presets.js";

const path = "/api/pages/fl-12345678-1234-4234-8234-123456789abc";
test("local publishing returns a public NFC URL and forwards only necessary headers", async () => {
  const db = openLocalDatabase(":memory:");
  try {
    const response = await relayPublishing(
      new Request("http://localhost:5173" + path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + "a".repeat(64),
          Origin: "http://localhost:5173",
          Cookie: "private-session=secret",
        },
        body: JSON.stringify(createDocument("card", true)),
      }),
      "https://public.example",
      async (url, options) => {
        assert.equal(url.origin, "https://public.example");
        assert.equal(options.headers.get("Cookie"), null);
        assert.equal(options.headers.get("Origin"), null);
        assert.equal(
          options.headers.get("Authorization"),
          "Bearer " + "a".repeat(64),
        );
        return handlePagesApi(new Request(url, options), db);
      },
    );
    assert.equal(response.status, 200);
    const { document } = await response.json();
    assert.equal(
      document.publishedUrl,
      "https://public.example/p/fl-12345678-1234-4234-8234-123456789abc",
    );
    const visitor = await handlePagesApi(
      new Request("https://public.example" + path),
      db,
    );
    assert.equal(visitor.status, 200);
    assert.equal(
      (await visitor.json()).document.details.fullName,
      "Alex Morgan",
    );
  } finally {
    db.close();
  }
});

test("relay rejects unrelated routes and cross-origin writes; upstream failures stay errors", async () => {
  const never = async () => {
    throw new Error("Must not forward");
  };
  assert.equal(
    (
      await relayPublishing(
        new Request("http://localhost:5173/api/other"),
        "https://public.example",
        never,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await relayPublishing(
        new Request("http://localhost:5173" + path, {
          method: "DELETE",
          headers: { Origin: "https://other.example" },
        }),
        "https://public.example",
        never,
      )
    ).status,
    403,
  );
  const unavailable = await relayPublishing(
    new Request("http://localhost:5173" + path),
    "https://public.example",
    async () => new Response("Sign in required", { status: 200 }),
  );
  assert.equal(unavailable.status, 503);
});
