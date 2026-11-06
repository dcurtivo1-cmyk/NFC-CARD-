# Making public profile links work across devices

This repository implements a localStorage prototype. The following is a proposed integration contract; no API or backend described here exists in this build.

## Persistence adapter

Replace the synchronous adapter in `src/lib/storage.js` with an asynchronous API client. Update Editor, Dashboard, and Profile to await it, expose loading/error states, and distinguish the authenticated owner's draft view from a public profile view. Keep the editor recovery cache as an optional local feature.

Suggested endpoints:

| Endpoint                      | Access               | Purpose                                                 |
| ----------------------------- | -------------------- | ------------------------------------------------------- |
| `GET /api/pages`              | Owner authenticated  | List the owner's drafts and generated pages             |
| `POST /api/pages`             | Owner authenticated  | Validate data, assign a server ID, create a draft       |
| `PATCH /api/pages/:id`        | Owner authenticated  | Validate and save changes with ownership/version checks |
| `POST /api/pages/:id/publish` | Owner authenticated  | Publish validated public fields                         |
| `DELETE /api/pages/:id`       | Owner authenticated  | Delete or unpublish a page and clean up owned uploads   |
| `GET /api/public/pages/:id`   | Public, rate limited | Return only published public profile data               |
| `POST /api/uploads`           | Owner authenticated  | Validate and upload supported images to object storage  |

Use a database for document JSON, owner ID, status, creation/update timestamps, and version. Use object storage for images, storing URLs and asset IDs instead of base64 data. Keep pending edits private if a page is already published; publishing should update a separate public snapshot transactionally. Use stable IDs so existing QR codes remain valid after edits.

The public `/p/:id` React route should fetch `GET /api/public/pages/:id`, show loading and missing states, and render the shared `ProfileCard`. That endpoint must not depend on localStorage, cookies from the creator, or access to an editor recovery cache. Maintain the host's SPA route fallback.

## Production essentials

- Authenticate owners and authorize every read, update, delete, and upload on the server. Browser-local records provide no authorization.
- Validate names, field sizes, arrays, colors, URL protocols, social destinations, and image contents on the server. Never accept a claimed owner ID from the client.
- Decode and re-encode uploads, enforce byte and dimension limits, scan as appropriate, prevent executable uploads, and handle orphaned assets.
- Define publishing consent, privacy rules, deletion/recovery, rate limits, abuse reporting, backups, and monitoring.
- Use HTTPS, security headers, an appropriate CSP, server logs without private contact data, and accessible error/retry states.
- Generate share URLs from the canonical production origin. Keep QR and vCard generation in the browser; point QR codes at the stable published URL.
- Add API integration tests, ownership tests, and an end-to-end check opening a published URL from a clean browser on another device.

Update the demo labels only after cross-device persistence is implemented and verified. A static deployment by itself does not satisfy this requirement.
