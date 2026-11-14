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
      <div className="loading-art" aria-hidden="true">
        <span className="loading-ripple" />
        <span className="loading-ripple loading-ripple-second" />
        <div className="loading-logo-frame">
          <img
            className="loading-logo"
            src="/TapSync_NFC_Sync.png"
            alt=""
            width="500"
            height="500"
            fetchPriority="high"
          />
        </div>
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
