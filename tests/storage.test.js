import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createDocument } from "../src/data/presets.js";
import {
  cacheEditor,
  clearEditor,
  deleteDocument,
  normalizeDocument,
  readDocuments,
  readEditor,
  saveDocument,
  STORAGE_KEY,
} from "../src/lib/storage.js";

let memory;
beforeEach(() => {
  memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, val) => memory.set(key, val),
    removeItem: (key) => memory.delete(key),
  };
  globalThis.window = { dispatchEvent: () => {} };
});
test("save, update, load and delete preserve a unique stable ID and created date", () => {
  const a = saveDocument(createDocument("card", true));
  const b = saveDocument(createDocument("card", true));
  assert.notEqual(a.id, b.id);
  assert.equal(readDocuments().length, 2);
  const updated = saveDocument(
    { ...a, details: { ...a.details, fullName: "Updated" } },
    "generated",
  );
  assert.equal(updated.id, a.id);
  assert.equal(updated.createdAt, a.createdAt);
  assert.equal(updated.status, "generated");
  assert.equal(
    readDocuments().find((x) => x.id === a.id).details.fullName,
    "Updated",
  );
  deleteDocument(a.id);
  assert.deepEqual(
    readDocuments().map((x) => x.id),
    [b.id],
  );
});
test("automatic recovery does not overwrite an explicitly saved profile", () => {
  const saved = saveDocument(createDocument("card", true), "generated");
  cacheEditor({
    ...saved,
    details: { ...saved.details, fullName: "Unsaved changes" },
  });
  assert.equal(readEditor().details.fullName, "Unsaved changes");
  assert.equal(readDocuments()[0].details.fullName, "Alex Morgan");
  clearEditor();
  assert.equal(readEditor(), null);
});

test("full or disabled storage produces an actionable error without reporting success", () => {
  localStorage.setItem = () => {
    throw new Error("QuotaExceeded");
  };
  assert.throws(
    () => saveDocument(createDocument()),
    /storage may be full or disabled/,
  );
  assert.equal(readDocuments().length, 0);
  assert.throws(
    () => cacheEditor(createDocument()),
    /Auto-recovery is unavailable/,
  );
});
test("corrupted data is not silently replaced and invalid records are ignored", () => {
  memory.set(STORAGE_KEY, "{broken");
  assert.throws(readDocuments, /unreadable/);
  assert.throws(() => saveDocument(createDocument()), /unreadable/);
  assert.equal(memory.get(STORAGE_KEY), "{broken");
  memory.set(STORAGE_KEY, JSON.stringify([{}, { type: "unknown" }]));
  assert.deepEqual(readDocuments(), []);
});
test("normalization constrains styles and strips unknown fields", () => {
  const doc = createDocument("card", true);
  doc.design.primary = "url(javascript:bad)";
  doc.design.radius = 999;
  doc.details.unknown = true;
  const normalized = normalizeDocument(doc);
  assert.equal(normalized.design.radius, 28);
  assert.match(normalized.design.primary, /^#[\da-f]{6}$/i);
  assert.equal(normalized.details.unknown, undefined);
});

test("showcase fields survive saves while older drafts load with empty showcase fields", () => {
  const doc = createDocument("brochure", true);
  doc.details.showcaseImage = "data:image/jpeg;base64,c2hvd2Nhc2U=";
  doc.details.showcaseCaption = "A little view of our latest project";
  const saved = saveDocument(doc);
  const loaded = readDocuments().find((item) => item.id === saved.id);
  assert.equal(loaded.details.showcaseImage, doc.details.showcaseImage);
  assert.equal(loaded.details.showcaseCaption, doc.details.showcaseCaption);
  delete doc.details.showcaseImage;
  delete doc.details.showcaseCaption;
  assert.equal(normalizeDocument(doc).details.showcaseImage, "");
  assert.equal(normalizeDocument(doc).details.showcaseCaption, "");
});

test("cover photos survive storage and older drafts default to a gradient header", () => {
  const doc = createDocument("card", true);
  doc.details.coverPhoto = "data:image/jpeg;base64,Y292ZXI=";
  const saved = saveDocument(doc, "generated");
  assert.equal(
    readDocuments().find((item) => item.id === saved.id).details.coverPhoto,
    doc.details.coverPhoto,
  );
  delete doc.details.coverPhoto;
  assert.equal(normalizeDocument(doc).details.coverPhoto, "");
});
