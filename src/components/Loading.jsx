import { useEffect, useState } from "react";

// The scene also appears in index.html for feedback before JavaScript arrives.
export function TapSyncScene() {
  return (
    <svg
      className="tap-scene"
      viewBox="0 0 360 240"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="182"
        cy="215"
        rx="140"
        ry="10"
        fill="#12131C"
        opacity=".45"
      />
      <circle className="tap-halo" cx="274" cy="107" r="84" fill="#C4B5FD" />
      <g className="tap-phone">
        <rect
          x="225"
          y="25"
          width="104"
          height="188"
          rx="23"
          fill="#11121B"
          stroke="#686579"
          strokeWidth="1.5"
        />
        <rect x="231" y="31" width="92" height="176" rx="18" fill="#262735" />
        <rect
          className="tap-screen-light"
          x="231"
          y="31"
          width="92"
          height="176"
          rx="18"
          fill="#C4B5FD"
        />
        <rect x="261" y="38" width="32" height="6" rx="3" fill="#11121B" />
        <circle cx="277" cy="100" r="23" stroke="#C4B5FD" strokeOpacity=".2" />
        <g
          className="tap-screen-idle"
          stroke="#C4B5FD"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M267 94a9 9 0 0 1 0 12M273 89a16 16 0 0 1 0 22M279 84a23 23 0 0 1 0 32" />
        </g>
        <g className="tap-screen-success">
          <circle cx="277" cy="100" r="22" fill="#C4B5FD" />
          <path
            d="m267 100 7 7 13-14"
            stroke="#292637"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <rect
          x="253"
          y="142"
          width="48"
          height="4"
          rx="2"
          fill="#C4B5FD"
          opacity=".3"
        />
        <rect
          x="262"
          y="153"
          width="30"
          height="3"
          rx="1.5"
          fill="#C4B5FD"
          opacity=".15"
        />
        <rect
          x="263"
          y="196"
          width="28"
          height="3"
          rx="1.5"
          fill="#EDEAF8"
          opacity=".25"
        />
      </g>
      <g className="tap-card">
        <rect
          x="22"
          y="92"
          width="132"
          height="84"
          rx="14"
          fill="#353044"
          stroke="#C4B5FD"
          strokeOpacity=".65"
        />
        <svg x="35" y="104" width="105" height="32" viewBox="0 0 105 32">
          <image
            className="loading-logo"
            href="/brand-logo.png"
            width="32"
            height="32"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <text x="38" y="21" fill="#EDEAF8" fontSize="13" fontWeight="700">
            TapSync
          </text>
        </svg>
        <path
          d="M36 153h39M36 160h24"
          stroke="#C4B5FD"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".5"
        />
        <g stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round">
          <path d="M124 149a5 5 0 0 1 0 8M129 146a9 9 0 0 1 0 14M134 143a13 13 0 0 1 0 20" />
        </g>
      </g>
      <g stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round">
        <path className="tap-wave tap-wave-one" d="M198 64q12 16 0 32" />
        <path className="tap-wave tap-wave-two" d="M198 64q12 16 0 32" />
        <path className="tap-wave tap-wave-three" d="M198 64q12 16 0 32" />
      </g>
    </svg>
  );
}

// Render content immediately when ready; only the departing overlay stays for its fade.
export function LoadingOverlay({
  loading,
  children,
  label = "Opening your page…",
  ...props
}) {
  const [present, setPresent] = useState(loading);
  useEffect(() => {
    if (loading) {
      setPresent(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPresent(false);
      return;
    }
    const timer = setTimeout(() => setPresent(false), 300);
    return () => clearTimeout(timer);
  }, [loading]);
  return (
    <>
      {children}
      {(loading || present) && (
        <div
          className={`loading-overlay${loading ? "" : " is-leaving"}`}
          aria-hidden={!loading || undefined}
          onAnimationEnd={(event) => {
            if (!loading && event.target === event.currentTarget)
              setPresent(false);
          }}
        >
          <Loading {...props} fullScreen>
            {label}
          </Loading>
        </div>
      )}
    </>
  );
}

export function dismissStartupLoader() {
  const splash = document.getElementById("startup-loader");
  if (!splash || splash.dataset.leaving) return;
  // A route/data loader takes over seamlessly while the page is still pending.
  if (
    document.querySelector("#root .folio-loading") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    splash.remove();
    return;
  }
  splash.dataset.leaving = "true";
  splash.setAttribute("aria-hidden", "true");
  splash.classList.add("is-leaving");
  splash.addEventListener("animationend", (event) => {
    if (event.target === splash) splash.remove();
  });
  // Cleanup fallback if an embedding site disables CSS animations.
  setTimeout(() => splash.remove(), 300);
}

export function LoadingSpinner({ size = 18 }) {
  return (
    <span
      className="loading-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export default function Loading({
  children = "Getting things ready…",
  detail = "TapSync · One tap. A new connection.",
  fullScreen = false,
}) {
  return (
    <div
      className={`folio-loading ${fullScreen ? "folio-loading-full" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <TapSyncScene />
      <div className="loading-copy">
        <p className="loading-title">{children}</p>
        <p className="loading-detail">{detail}</p>
      </div>
      <div className="loading-track" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
