# Published pages and NFC links

Generating a demo now uploads a public snapshot. Visitors at `/p/:id` fetch it from the server, including its design and cropped photos, without the creator's localStorage. The NFC card and QR contain this stable URL; publishing edits does not change it.

## Implemented API

| Endpoint                | Access          | Behavior                                                                                              |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /api/pages/:id`    | Public          | Return the published snapshot, or 404. No private editing key or hash is exposed.                     |
| `PUT /api/pages/:id`    | Bearer edit key | Validate and atomically create or replace a public snapshot. Existing pages require the original key. |
| `DELETE /api/pages/:id` | Bearer edit key | Remove the published snapshot. Repeating an authorized deletion is safe.                              |

Page IDs are `fl-` plus a cryptographic UUID. A separate random 256-bit key authorizes writes; the database stores its SHA-256 hash. Conditional SQL prevents a different key from claiming an existing page, including simultaneous first writes. Keys never appear in profile URLs, QR codes, or public responses. Browser access stays same-origin with no CORS permission; bearer keys also authorize requests arriving through supported host rewrites.

The client stores the edit key before making the first upload. A lost response can be retried at the same URL with the same key. A failed upload preserves the local page and displays the error. Public routes show loading, missing, and retry states. Failed reads of already published pages do not substitute potentially stale local data. Older local-only generated demos have a **Publish page** action in the sharing dialog.

Drafts and recovery copies stay local. **Save changes** on an already published page also publishes the changes. The workspace deletes the remote snapshot before deleting its local record. Duplicating a page clears its ID and publishing status.

## Storage and deployment

- Hosted: `worker/index.js` uses the `DB` D1 binding from `.openai/hosting.json`. Sites provisions it and applies `drizzle/0000_published_pages.sql` using the committed migration journal. Table creation is never performed during hosted requests.
- Local app: Vite's development and preview middleware relay publishing to the existing public Sites service. Only Authorization and Content-Type are forwarded. Responses include `publishedUrl`, which the workspace saves and the sharing dialog uses for both QR and copied links.
- Isolated tests: `FOLIO_LOCAL_PUBLISHING=1` enables Node SQLite in ignored `.folio-data/pages.sqlite`. Browser tests use a separate server on port 5180. Use Node 22.13 or newer, preferably Node 24.
- Build: `npm run build` builds React and bundles the Worker with embedded assets into `dist/server/index.js`. Sites packaging includes the hosting manifest and schema migrations. No credentials, private editing keys or local database files belong in source or deployment archives.
- Static hosting: the included Netlify and Vercel proxy rules route `/api/pages/:id` to the public Sites service before the SPA fallback. Publication failures remain visible; the app never substitutes a local-only URL for a confirmed public link.

Design changes must ship to both the frontend and the Sites publishing Worker. The Worker validates saved designs using `src/lib/design.js`; an older Worker can discard a new template even when the editor already supports it. Deploy the updated Worker before releasing a frontend that sends new design fields. After an update, regenerate affected pages from their saved editor drafts to restore design fields discarded by an older server.

Public snapshots include resized raster images as data URLs and are limited to 1.5 MB per request. This keeps rows below D1's row-size limit. Oversized payloads return 413 with guidance to use smaller photos. For larger media collections, migrate images to object storage and keep only their public URLs in the snapshot.

## NFC workflow

1. Open the app locally or on its public host and create or load a page.
2. Choose **Generate my demo**, or **Update demo profile** for an existing page. Wait for the sharing dialog confirming publication.
3. Copy **Your actual profile URL**. In your NFC writing app choose **URL / Website**, paste the URL, then write the card.
4. Tap the card with a different phone to verify it. Use **Save changes** or regenerate to update its page at the same URL.

Normal local development publishes directly to the public host through its server relay. For older local demos, open **Share & QR → Publish page**. The returned public URL works across devices while the editor remains in the original app. Only isolated offline test mode returns development links; those are explicitly marked as unsuitable for NFC.

## Current limits

There is no account-based workspace sync or editing-key recovery. Clearing site data leaves published pages online but removes this browser's ability to manage them. Anyone with a profile URL can view its published fields. The publishing API accepts new pages without an account; account ownership, per-user quotas, edge rate limiting, reporting and account recovery can be added for a larger public service. Public traffic and storage should be monitored through the hosting provider.

## Verification

`npm test` covers validation, storage across a server restart, key authorization, stable updates, deletion, request size limits and public response filtering. Browser tests verify publishing, clean-context visits with browser storage disabled, copied links and QR exports, publishing failures and retries, and remote deletion invalidating an existing URL.
