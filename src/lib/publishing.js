import { normalizeDocument } from "./storage.js";

const KEYS = "folio-studio-publish-keys-v1";
function keys() {
  const raw = localStorage.getItem(KEYS);
  const value = raw ? JSON.parse(raw) : {};
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new Error(
      "Saved publishing keys are unreadable. Keep this browser's site data to retain editing access.",
    );
  return value;
}
export function canManagePublishedPage(id) {
  try {
    return Boolean(keys()[id]);
  } catch {
    return false;
  }
}
async function requestPage(id, options = {}) {
  let response;
  try {
    response = await fetch(`/api/pages/${encodeURIComponent(id)}`, {
      ...options,
      cache: "no-store",
      signal: options.signal || AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(
      "Could not reach the publishing server. Your local work is saved; check your connection and try again.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Publishing is not configured on this host. Your local work is saved; the site needs its publishing backend.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      data.error || "Could not complete the publishing request.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export async function publishPage(document) {
  const savedKeys = keys();
  let token = savedKeys[document.id];
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    // Persist before uploading so a lost response can safely be retried.
    try {
      localStorage.setItem(
        KEYS,
        JSON.stringify({ ...savedKeys, [document.id]: token }),
      );
    } catch {
      throw new Error(
        "Publishing needs permission to save your private edit key in this browser. Free some browser storage and try again.",
      );
    }
  }
  const data = await requestPage(document.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: document.type,
      details: document.details,
      design: document.design,
    }),
  });
  const published = normalizeDocument(data.document);
  if (!published?.publishedAt)
    throw new Error(
      "The server did not confirm publication. Please try again.",
    );
  return {
    ...document,
    status: "generated",
    publishedAt: published.publishedAt,
  };
}
export async function fetchPublishedPage(id, signal) {
  const data = await requestPage(id, { signal });
  const document = normalizeDocument(data.document);
  if (!document?.publishedAt || document.id !== id)
    throw new Error("The server returned an invalid published page.");
  return document;
}
export async function deletePublishedPage(id) {
  const savedKeys = keys();
  if (!savedKeys[id])
    throw new Error(
      "This browser does not have the private key needed to delete the published page.",
    );
  await requestPage(id, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${savedKeys[id]}` },
  });
  // Retain the key until the local record is removed; a failed local deletion is retryable.
}
export function isPublicHost() {
  const host = window.location.hostname;
  return (
    !(
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i.test(
        host,
      ) || host.endsWith(".local")
    ) && window.location.protocol === "https:"
  );
}
