export const PUBLIC_SITE_ORIGIN =
  "https://folio-nfc-studio.buffhutch.chatgpt.site";

// Forward publishing requests, never the visitor's cookies or other credentials.
export async function relayPublishing(
  request,
  origin = PUBLIC_SITE_ORIGIN,
  send = fetch,
) {
  const url = new URL(request.url);
  if (!/^\/api\/pages\/fl-[a-f0-9-]{36}$/i.test(url.pathname))
    return Response.json({ error: "Page not found." }, { status: 404 });
  const incomingOrigin = request.headers.get("Origin");
  if (incomingOrigin && incomingOrigin !== url.origin)
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const headers = new Headers();
  for (const key of ["Content-Type", "Authorization"]) {
    if (request.headers.has(key)) headers.set(key, request.headers.get(key));
  }
  try {
    const upstream = await send(new URL(url.pathname, origin), {
      method: request.method,
      headers,
      ...(["GET", "HEAD"].includes(request.method)
        ? {}
        : { body: request.body, duplex: "half" }),
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.headers.get("Content-Type")?.includes("application/json"))
      throw new Error("Invalid publishing response");
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Could not reach the public publishing service. Your local work is saved; please try again.",
      },
      { status: 503 },
    );
  }
}
