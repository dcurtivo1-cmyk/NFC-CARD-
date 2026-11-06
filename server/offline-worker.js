// SHELL_CACHE and SHELL_URLS are injected by the production build.
const PAGE_CACHE = "folio-public-pages-v1";
const pagePath = /^\/api\/pages\/fl-[a-z0-9-]+$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("folio-shell-") && key !== SHELL_CACHE)
          await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

async function network(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    // Read the body within the deadline too, including photos in profile JSON.
    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readPage(request) {
  const key = new URL(request.url).pathname;
  let cache;
  try {
    cache = await caches.open(PAGE_CACHE);
  } catch {
    /* Online reads still work without storage. */
  }
  try {
    const response = await network(request);
    if (response.status >= 500) throw new Error("Server unavailable");
    if (
      response.ok &&
      response.headers.get("Content-Type")?.includes("application/json")
    ) {
      try {
        await cache?.put(key, response.clone());
      } catch {
        /* Full storage must not break online viewing. */
      }
    } else if (response.status === 404 || response.status === 410) {
      try {
        await cache?.delete(key);
      } catch {}
    }
    return response;
  } catch {
    const saved = await cache?.match(key);
    if (saved) {
      const headers = new Headers(saved.headers);
      headers.set("X-Folio-Offline", "1");
      return new Response(await saved.arrayBuffer(), { headers });
    }
    return new Response(
      JSON.stringify({
        error:
          "This page is not saved for offline use on this device. Connect to the internet and open it once first.",
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (pagePath.test(url.pathname)) {
    if (request.method === "GET" && !request.headers.has("Authorization")) {
      event.respondWith(readPage(request));
    } else if (request.method === "PUT" || request.method === "DELETE") {
      // Never queue writes offline or retain edit credentials in a cache.
      event.respondWith(
        (async () => {
          const response = await fetch(request);
          if (response.ok) {
            try {
              await (await caches.open(PAGE_CACHE)).delete(url.pathname);
            } catch {}
          }
          return response;
        })(),
      );
    }
    return;
  }
  if (request.method !== "GET") return;
  if (request.mode === "navigate" && /^\/p\/[^/]+\/?$/.test(url.pathname)) {
    // Pair the HTML with this worker's cached build, so offline lazy imports match.
    event.respondWith(
      (async () => {
        const shell = await caches.open(SHELL_CACHE);
        return (await shell.match("/index.html")) || fetch(request);
      })(),
    );
  } else if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const shell = await caches.open(SHELL_CACHE);
        return (await shell.match(url.pathname)) || fetch(request);
      })(),
    );
  }
});

self.addEventListener("message", (event) => {
  if (
    event.data?.type !== "SAVE_PUBLIC_PAGE" ||
    !/^fl-[a-z0-9-]+$/i.test(event.data.id || "")
  )
    return;
  event.waitUntil(
    (async () => {
      let ready = false;
      try {
        const path = `/api/pages/${event.data.id}`;
        const response = await readPage(
          new Request(new URL(path, self.location.origin), {
            cache: "no-store",
          }),
        );
        ready =
          response.ok &&
          Boolean(await (await caches.open(PAGE_CACHE)).match(path));
      } catch {}
      event.ports[0]?.postMessage({ ready });
    })(),
  );
});
