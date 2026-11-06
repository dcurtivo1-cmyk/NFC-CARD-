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
  // Older iOS and in-app browsers support AbortController but not
  // AbortSignal.any/timeout. Keep cancellation and the deadline compatible.
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(cancel, 20_000);
  try {
    let response;
    try {
      response = await fetch(`/api/pages/${encodeURIComponent(id)}`, {
        ...options,
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new Error(
        "Could not reach the publishing server. Check your connection and try again.",
      );
    }
    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new Error(
        controller.signal.aborted
          ? "Loading the page took too long. Please try again."
          : "The publishing server returned an invalid response. Please try again.",
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
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
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
    publishedUrl: published.publishedUrl,
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
export function isPublicHost(value = window.location.href) {
  const url = new URL(value);
  const host = url.hostname;
  return (
    !(
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i.test(
        host,
      ) || host.endsWith(".local")
    ) && url.protocol === "https:"
  );
}
