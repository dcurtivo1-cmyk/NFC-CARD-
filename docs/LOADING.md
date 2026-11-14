# TapSync loading animation

The card, three traveling signals, and phone screen share a 3.6-second CSS cycle. The background stays `#1D1E28` in both interface modes, with `#C4B5FD` accents. Reduced-motion preferences show a still illustration.

## React integration

Load `/loading.css` once in your HTML head and keep `/TapSync_NFC_Sync.png` available. Import the reusable component:

```jsx
import { LoadingOverlay } from "./components/Loading";

<LoadingOverlay loading={isLoading} label="Opening your page…">
  {!isLoading && <YourPage />}
</LoadingOverlay>;
```

Set `isLoading` from your real data request. Content renders immediately when it becomes false; the overlay fades for 240 ms and stops intercepting clicks immediately. It never waits for the illustration's loop. A 300 ms cleanup fallback removes it if animation events are unavailable. Reduced-motion mode dismisses immediately. Errors should also set `isLoading` to false so visitors can see and use the retry UI.

`Loading` is the standalone illustration for existing Suspense fallbacks. `LoadingSpinner` remains available for compact button indicators.

## Existing site

`index.html` includes a static copy of the scene outside React's root so the first visit has feedback before JavaScript loads. `App` calls `dismissStartupLoader()` after mounting: an existing route/data loader takes over, or the startup overlay fades immediately over the ready page. The public NFC page uses `LoadingOverlay` for its actual fetch and retries.

When changing the SVG illustration in `TapSyncScene`, update the matching static scene in `index.html` too. Keep the startup overlay outside `#root` so React mounting does not interrupt its exit fade.
