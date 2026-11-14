// Shared with the lightweight HTML splash so NFC visits have feedback before JS loads.
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
  detail = "A little page. A lasting impression.",
  fullScreen = false,
}) {
  return (
    <div
      className={`folio-loading ${fullScreen ? "folio-loading-full" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="loading-art" aria-hidden="true">
        <span className="loading-ripple" />
        <span className="loading-ripple loading-ripple-second" />
        <div className="loading-card">
          <span className="loading-card-brand">
            folio<span>.</span>
          </span>
          <svg className="loading-signal" viewBox="0 0 32 32" fill="none">
            <circle cx="8" cy="16" r="2" fill="currentColor" />
            <path
              d="M14 10a9 9 0 0 1 0 12M19 6a15 15 0 0 1 0 20M24 2a21 21 0 0 1 0 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="loading-card-line" />
          <span className="loading-card-line loading-card-line-short" />
        </div>
        <span className="loading-spark" />
      </div>
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
