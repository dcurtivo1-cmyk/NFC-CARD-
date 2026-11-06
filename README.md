# Folio Studio

A responsive digital business card and digital page generator, built with React, Vite, Tailwind CSS, Lucide React, React Router, and qrcode.react. Folio has original branding, an original illustrated sample avatar, and no proprietary assets.

## Run locally

Use Node.js **22.13 or newer** (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually **http://127.0.0.1:5173**. On Windows PowerShell, if script execution blocks npm, use `npm.cmd install` and `npm.cmd run dev`. In a restricted workspace, use `npm.cmd install --cache .npm-cache` to keep npm’s cache inside the project.

```sh
npm run build       # Production files in dist/
npm run preview     # Preview the production build
npm test            # Validation, vCard, link safety, storage and recovery tests
npm run test:e2e    # Browser interaction and responsive checks
```

The Playwright configuration uses installed Google Chrome on Windows when available. Elsewhere, run `npx playwright install chromium` first, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to your Chromium-compatible browser. Browser tests automatically start and stop the dev server if one is not already running on port 5173. Screenshots and failure traces are written to `test-results/`.

The native Vite config loader and a small dependency resolver keep development compatible with this workspace’s Windows parent-directory restrictions. These also work in normal local installations.

## Try the workflow

The sun/moon toggle in the header switches the **generator interface** between light and dark mode, including navigation, forms, the workspace, design controls, notifications, and dialogs. It follows your system preference until you make a choice, then remembers that choice in `folio-studio-color-mode` in localStorage and synchronizes it across tabs. If storage is unavailable, the toggle still works for the current visit. Interface mode is independent of your card template and palette: it never recolors or changes saved profiles. The initial mode is applied in the HTML head before the interface renders.

1. Open **Explore products** and choose a Calling Card, Digital Menu, Digital Brochure, Google Review, Social Media Page, or NFC / QR Landing Page.
2. Select **Start from scratch** or **Try sample details**. Both use the manual editor.
3. Enter your details. Optional groups include a profile photo, logo, contact info, social profiles, and up to 30 custom links. Digital Menus support up to 100 items; Brochures and Reviews have dedicated destination links.
4. Upload any browser-supported image format up to 5 MB using the image picker, including JPG/JPEG, PNG, WebP, GIF, BMP, SVG, and other formats your browser can decode. Files are decoded rather than rejected by an extension or MIME-type whitelist. Unsupported or damaged images show an error. Adjust zoom and horizontal/vertical position in the crop dialog. Profile photos and logos become 512 × 512 JPEGs. The **Showcase** section in **Step 01 → Your details**, directly after the brand section, adds a featured image and optional caption to any page type; showcase images use a 1024 × 576 landscape crop. All images can be replaced or removed, update the live preview, and persist with drafts and generated profiles. Animations are saved as a still image. Formats such as HEIC or TIFF may need conversion first if your browser cannot decode them.
5. Choose a complete template: Modern Blue, Premium Dark, Minimal Light, Gradient, or Elegant. Mix it with one of seven color palettes or your own primary, background, text, and header gradient colors. Independently choose a header layout (classic, centered, side by side, or minimal), button layout (stacked, two-column custom links, or compact rows), background style (solid, gradient, dots, or grid), six fonts, four button styles, four icon styles, and corner radius. The phone preview updates immediately. Choosing a template resets design settings; switching palettes preserves your layouts, typography, and content. These settings persist with drafts, recovery copies, and generated profiles, including compatibility with older saved drafts.
6. Preview and **Generate my demo**. This publishes the page and its photos to the server. Copy its actual URL for your NFC card, download its QR as PNG or SVG, and export Calling Cards as `.vcf` contacts. Published edits retain the same URL.
7. Return to **My workspace** to search, sort, load, duplicate, share, edit, or delete locally saved pages. Resetting an editor requires confirmation and does not delete an existing saved page.

**Save draft** allows incomplete information. Moving to design/preview and generating validates required and populated fields. A review page requires your own Google review link; its illustrative placeholder is intentionally rejected.

**Cover photo:** In **Step 01 → Your details → Your brand, at a glance**, use **Cover photo → Upload image** to add a header image. It accepts the same browser-supported image formats, crops to a 3:1 landscape JPEG at 1200 × 400, and supports replacement and removal. The photo appears in every header layout (including Minimal when a photo is present), the live preview, workspace thumbnail, and saved generated profile. Header colors remain saved underneath it; removing the photo restores the selected header layout and colors. Changing templates or palettes keeps your uploaded photo.

Contact buttons generate real `tel:`, `mailto:`, WhatsApp, website, social, and Google Maps destinations. Sample links are examples. The NFC product creates a page and QR destination; physical NFC tags must be written with a separate NFC-writing app or device.

## Publishing, storage and NFC sharing

**Generated pages are published to persistent server storage. Drafts, workspace records and private editing keys stay in the creator's browser.**

- Explicitly saved drafts and generated profiles use `folio-studio-documents-v1` in localStorage.
- A debounced recovery copy of the current editor uses `folio-studio-editor-v1`. Recovery never overwrites an explicitly saved profile until you save it. Use **Continue editing** in the workspace to resume the recovery copy.
- New records receive `fl-` plus a cryptographically generated UUID. Updates keep the same ID and creation timestamp.
- The generated route is `/p/:id`. The QR and copied link use the public URL confirmed by the publishing server, including when you generate from localhost. QR PNG exports are 1024 × 1024 pixels; SVG exports are scalable.
- Generating uploads a public snapshot to `PUT /api/pages/:id`. The public route fetches `GET /api/pages/:id`, so visitors need no browser data or account. Upload failures retain local work and do not show a successful publication or NFC-ready QR.
- Updates and deletion require a random 256-bit edit key, saved separately under `folio-studio-publish-keys-v1`; only its SHA-256 hash is stored on the server. Public responses never expose it. Duplicates receive independent IDs and keys.
- Clearing browser data removes drafts and editing keys. Published pages remain online, but this version has no account-based recovery or workspace sync. Deleting a published page from the workspace removes the server snapshot before removing its local record.
- Images are cropped locally and uploaded inside the published snapshot. The complete publishing request is limited to 1.5 MB. The optional Google Fonts stylesheet is requested externally; system font fallbacks work offline.
- Existing local demos can be published from **Share & QR → Publish page**. Drafts remain local until generated. Use **Save changes** on a published page to publish the edited details at its existing URL.
- For NFC, generate in this app, choose **URL / Website** in your NFC-writing app, paste the confirmed public profile URL, and write the card. The development app forwards publishing to the existing public host so its links also work on other phones.

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for the implemented API, hosting configuration and storage limits.

## Hosting

`npm run build` produces the React frontend and `dist/server/index.js`, a Cloudflare Worker with embedded assets and the publishing API. Sites provisions the `DB` D1 binding declared in `.openai/hosting.json` and applies the versioned SQL in `drizzle/`. Publish the Worker through Sites; the server serves direct links and reloads at `/p/:id` and `/editor/:id`.

`npm run dev` and `npm run preview` forward publishing to the existing public Sites service. Vercel and Netlify use the included API proxy rules for the same service. Only the publishing request and private edit key are forwarded; cookies are excluded. Public pages return a canonical HTTPS URL that is saved alongside your local workspace record.

For isolated offline development and browser tests, set `FOLIO_LOCAL_PUBLISHING=1` to use Node SQLite in `.folio-data/pages.sqlite` (Node 22.13 or newer; Node 24 recommended). This directory is ignored by Git and is never uploaded. Browser tests start their own isolated server on port 5180 and do not write test pages to the public host.

## Project structure

```text
src/
  components/       Reusable forms, cropper, themes, phone renderer, dialogs, feedback
  data/presets.js   Six product definitions, five templates, sample and blank documents
  data/design.js    Independent palettes, layouts, fonts, button and icon choices
  lib/design.js    Design normalization and compatibility for saved profiles
  lib/profile.js   Safe destinations, validation, vCard, URLs, copy and downloads
  lib/storage.js   Local persistence and normalization boundary
  pages/           Landing, selection, editor, dashboard, profile, demo documentation
  App.jsx          Routes, lazy page loading, application error boundary
  styles.css       Tailwind integration, design system, responsive layouts
  profile-design.css   Template controls and shared profile layout variants
  color-mode.css    Light/dark generator interface styling, separate from profile styles
tests/
  *.test.js        Unit/integration checks for business rules and storage
  browser/         Playwright user journeys and responsive screenshots
```

`storage.js` owns the local workspace and recovery copy; `publishing.js` handles remote snapshots and private editing keys. `server/pages-api.js` validates public fields and authorizes writes. The Node SQLite adapter supports local development, while the deployed Worker uses D1 prepared statements. React escapes user text, executable URL schemes are rejected, and external links use `noopener noreferrer`.
