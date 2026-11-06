# Folio Studio

A responsive digital business card and digital page generator, built with React, Vite, Tailwind CSS, Lucide React, React Router, and qrcode.react. Folio has original branding, an original illustrated sample avatar, and no proprietary assets.

## Run locally

Use Node.js **22.12 or newer** (Node 24 recommended) and npm.

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
6. Preview and **Generate my demo**. Open the saved profile, copy its actual URL, download its QR as PNG or SVG, and export Calling Cards as `.vcf` contacts.
7. Return to **My workspace** to search, sort, load, duplicate, share, edit, or delete locally saved pages. Resetting an editor requires confirmation and does not delete an existing saved page.

**Save draft** allows incomplete information. Moving to design/preview and generating validates required and populated fields. A review page requires your own Google review link; its illustrative placeholder is intentionally rejected.

**Cover photo:** In **Step 01 → Your details → Your brand, at a glance**, use **Cover photo → Upload image** to add a header image. It accepts the same browser-supported image formats, crops to a 3:1 landscape JPEG at 1200 × 400, and supports replacement and removal. The photo appears in every header layout (including Minimal when a photo is present), the live preview, workspace thumbnail, and saved generated profile. Header colors remain saved underneath it; removing the photo restores the selected header layout and colors. Changing templates or palettes keeps your uploaded photo.

Contact buttons generate real `tel:`, `mailto:`, WhatsApp, website, social, and Google Maps destinations. Sample links are examples. The NFC product creates a page and QR destination; physical NFC tags must be written with a separate NFC-writing app or device.

## Prototype storage and sharing

**There is no backend, authentication, account, cloud upload, or cloud sync.**

- Explicitly saved drafts and generated profiles use `folio-studio-documents-v1` in localStorage.
- A debounced recovery copy of the current editor uses `folio-studio-editor-v1`. Recovery never overwrites an explicitly saved profile until you save it. Use **Continue editing** in the workspace to resume the recovery copy.
- New records receive `fl-` plus a cryptographically generated UUID. Updates keep the same ID and creation timestamp.
- The generated route is `/p/:id`. The QR encodes the current origin and this actual route. QR PNG exports are 1024 × 1024 pixels; SVG exports are scalable.
- These routes work **in the browser and origin where their data was saved**. Another device, browser, private window, domain, or port has separate storage and shows an explanatory missing-profile page.
- Deploying `dist/` makes the generator available, but **does not publish local profile data**. A QR scan on a different device needs persistent backend storage before it can display the profile. The app repeats this limitation in its sharing dialog and demo indicators.
- Clearing site data removes saved work. Browser quotas vary. Save failures and unavailable storage show actionable errors; corrupted data is not silently replaced.
- Uploaded images remain local. The optional Google Fonts stylesheet is requested externally; system font fallbacks work offline. The bundled sample avatar and all UI assets are local.

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for a proposed backend integration. It is guidance, not an implemented backend.

## Static hosting

Build with `npm run build` and host the **dist/** directory at the domain root. Configure a fallback to `index.html` for client-side routes, so direct links and reloads at `/p/:id` and `/editor/:id` work. This repository includes a Netlify-compatible `public/_redirects` and a Vercel rewrite configuration. For other hosts, use an equivalent SPA fallback.

Always use HTTPS for deployed clipboard access. The app also includes a legacy copy fallback and a selectable URL. Deployment alone retains the prototype’s per-browser data limitation.

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

The `storage.js` adapter is the main seam for replacing local persistence. Drafts and generated profiles share the same schema, with `status` controlling generated profile visibility. React escapes user text, executable URL schemes are rejected, and external links use `noopener noreferrer`. A production application must enforce its own server-side validation and access controls.
