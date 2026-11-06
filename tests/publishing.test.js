import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openLocalDatabase } from "../server/local-db.js";
import { handlePagesApi, MAX_PAGE_BYTES } from "../server/pages-api.js";
import { createDocument } from "../src/data/presets.js";

const id = "fl-12345678-1234-4234-8234-123456789abc";
const token = "a".repeat(64);
const url = `https://folio.example/api/pages/${id}`;
function request(method = "GET", document, key = token, extra = {}) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...extra,
    },
    ...(document ? { body: JSON.stringify(document) } : {}),
  });
}

test("published photos and design survive a server restart and require no visitor storage", async () => {
  const directory = mkdtempSync(join(tmpdir(), "folio-publish-"));
  const filename = join(directory, "pages.sqlite");
  let db = openLocalDatabase(filename);
  try {
    const document = createDocument("card", true);
    document.details.coverPhoto = "data:image/jpeg;base64,Y292ZXI=";
    document.design.headerLayout = "minimal";
    document.privateKey = "must never be returned";
    let response = await handlePagesApi(request("PUT", document), db);
    assert.equal(response.status, 200);
    db.close();
    db = openLocalDatabase(filename);
    response = await handlePagesApi(new Request(url), db);
    const body = await response.json();
    assert.equal(body.document.details.coverPhoto, document.details.coverPhoto);
    assert.equal(body.document.design.headerLayout, "minimal");
    assert.equal(body.document.id, id);
    assert.ok(body.document.publishedAt);
    assert.equal(body.document.privateKey, undefined);
    assert.equal(JSON.stringify(body).includes(token), false);
    assert.equal(JSON.stringify(body).includes("token_hash"), false);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("only the private edit key can replace or delete a published page, with stable URLs", async () => {
  const db = openLocalDatabase(":memory:");
  try {
    const document = createDocument("card", true);
    assert.equal((await handlePagesApi(request(), db)).status, 404);
    assert.equal(
      (await handlePagesApi(request("PUT", document, ""), db)).status,
      401,
    );
    assert.equal(
      (await handlePagesApi(request("PUT", document), db)).status,
      200,
    );
    document.details.fullName = "Changed name";
    assert.equal(
      (await handlePagesApi(request("PUT", document, "b".repeat(64)), db))
        .status,
      403,
    );
    assert.equal(
      (await handlePagesApi(request("DELETE", null, "b".repeat(64)), db))
        .status,
      403,
    );
    assert.equal(
      (await handlePagesApi(request("PUT", document), db)).status,
      200,
    );
    const published = (await (await handlePagesApi(request(), db)).json())
      .document;
    assert.equal(published.id, id);
    assert.equal(published.details.fullName, "Changed name");
    assert.equal((await handlePagesApi(request("DELETE"), db)).status, 200);
    assert.equal((await handlePagesApi(request(), db)).status, 404);
    assert.equal((await handlePagesApi(request("DELETE"), db)).status, 200);
  } finally {
    db.close();
  }
});

test("publishing validates details, images, authorization and request size before persisting", async () => {
  const db = openLocalDatabase(":memory:");
  try {
    const document = createDocument("card", true);
    document.details.fullName = "";
    assert.equal(
      (await handlePagesApi(request("PUT", document), db)).status,
      400,
    );
    document.details.fullName = "Taylor";
    document.details.profilePhoto = "javascript:alert(1)";
    assert.equal(
      (await handlePagesApi(request("PUT", document), db)).status,
      400,
    );
    document.details.profilePhoto = "";
    assert.equal(
      (
        await handlePagesApi(
          request("PUT", document, "", { Origin: "https://other.example" }),
          db,
        )
      ).status,
      401,
    );
    document.details.bio = "x".repeat(MAX_PAGE_BYTES);
    assert.equal(
      (await handlePagesApi(request("PUT", document), db)).status,
      413,
    );
    assert.equal((await handlePagesApi(request(), db)).status, 404);
    assert.equal((await handlePagesApi(request(), null)).status, 503);
  } finally {
    db.close();
  }
});
