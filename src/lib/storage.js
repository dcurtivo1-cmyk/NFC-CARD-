import { blankDetails, products } from "../data/presets.js";
import { normalizeDesign } from "./design.js";
import { preferredPublicUrl } from "./public-url.js";

export const STORAGE_KEY = "folio-studio-documents-v1";
const LAST_KEY = "folio-studio-editor-v1";

export function normalizeDocument(value) {
  if (
    !value ||
    !products.some((p) => p.id === value.type) ||
    typeof value.details?.fullName !== "string"
  )
    return null;
  const details = { ...blankDetails };
  for (const key of Object.keys(blankDetails)) {
    if (
      typeof blankDetails[key] === "string" &&
      typeof value.details[key] === "string"
    )
      details[key] = value.details[key];
  }
  details.customLinks = Array.isArray(value.details.customLinks)
    ? value.details.customLinks
        .filter(
          (x) => x && typeof x.label === "string" && typeof x.url === "string",
        )
        .slice(0, 30)
    : [];
  details.menuItems = Array.isArray(value.details.menuItems)
    ? value.details.menuItems
        .filter(
          (x) =>
            x &&
            ["name", "price", "description", "category"].every(
              (k) => typeof x[k] === "string",
            ),
        )
        .slice(0, 100)
    : [];
  const design = normalizeDesign(value.design);
  return {
    id: typeof value.id === "string" ? value.id : null,
    type: value.type,
    status: value.status === "generated" ? "generated" : "draft",
    details,
    design,
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null,
    publishedAt:
      typeof value.publishedAt === "string" ? value.publishedAt : null,
    publishedUrl: preferredPublicUrl(value.publishedUrl),
  };
}

function parse(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved browser data is unreadable. Existing data was preserved; check this site’s storage in your browser settings.",
    );
  }
}

export function readDocuments() {
  const value = parse(STORAGE_KEY, []);
  if (!Array.isArray(value))
    throw new Error("Saved browser data has an unsupported format.");
  return value
    .map(normalizeDocument)
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function saveDocument(document, status = "draft") {
  const documents = readDocuments();
  const timestamp = new Date().toISOString();
  const id = document.id || `fl-${crypto.randomUUID()}`;
  const saved = {
    ...document,
    id,
    status,
    updatedAt: timestamp,
    createdAt: document.createdAt || timestamp,
  };
  const next = [saved, ...documents.filter((d) => d.id !== id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      "Could not save. Browser storage may be full or disabled. Try smaller images or delete an unneeded saved page.",
    );
  }
  window.dispatchEvent(new Event("folio-storage"));
  return saved;
}

export function deleteDocument(id) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(readDocuments().filter((d) => d.id !== id)),
  );
  window.dispatchEvent(new Event("folio-storage"));
}

export function cacheEditor(document) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(document));
  } catch {
    throw new Error(
      "Auto-recovery is unavailable. Save your draft before leaving.",
    );
  }
}
export function readEditor() {
  const value = parse(LAST_KEY, null);
  return normalizeDocument(value);
}
export function clearEditor() {
  localStorage.removeItem(LAST_KEY);
}
