import { useRef, useState } from "react";
import { CreditCard, Download, LoaderCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { preferredPublicUrl } from "../lib/public-url";
import { isPublicHost } from "../lib/publishing";
import { downloadBlob, profileUrl } from "../lib/profile";
import { cardTextLines, physicalCardBlob } from "../lib/physical-card";
import { useFeedback } from "./UI";

function CardText({
  value,
  x,
  y,
  width,
  size = 3,
  limit = 24,
  maxLines = 2,
  ...props
}) {
  return cardTextLines(value, limit, maxLines).map((line, i) => (
    <text
      key={i}
      x={x}
      y={y + i * size * 1.2}
      fontSize={size}
      textLength={
        Array.from(line).length * size * 0.62 > width ? width : undefined
      }
      lengthAdjust="spacingAndGlyphs"
      {...props}
    >
      {line}
    </text>
  ));
}

function TapIcon({ x, y, color }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke={color}
      strokeWidth="0.65"
      strokeLinecap="round"
      aria-label="NFC tap icon"
    >
      <rect x="0" y="1.5" width="3.4" height="5.5" rx="0.6" />
      <path d="M5 3a2 2 0 0 1 0 3 M6.7 1.5a4 4 0 0 1 0 6 M8.5 0a6 6 0 0 1 0 9" />
    </g>
  );
}

export function PhysicalCardArtwork({ document, side, url, svgRef }) {
  const { details: d, design } = document;
  const front = side === "front";
  const color = design.text;
  const qrX = front ? 54 : 29.3;
  const qrY = front ? 18 : 16;
  return (
    <svg
      ref={svgRef}
      className="physical-card-artwork"
      xmlns="http://www.w3.org/2000/svg"
      width="85.6mm"
      height="53.98mm"
      viewBox="0 0 85.6 53.98"
      role="img"
      aria-label={`Physical NFC card ${side} for ${d.fullName || "your name"}`}
      fontFamily="Arial, sans-serif"
      fill={color}
    >
      <title>{`Physical NFC card — ${side} — ${d.fullName || "Your full name"}`}</title>
      <desc>
        Trim size 85.6 × 53.98 mm. Downloads include 3 mm bleed on each edge.
      </desc>
      <rect
        x="-3"
        y="-3"
        width="91.6"
        height="59.98"
        fill={design.background}
      />
      <rect x="-3" y="-3" width="91.6" height="5" fill={design.primary} />
      {front ? (
        <>
          {d.logo && (
            <image
              href={d.logo}
              x="5"
              y="6"
              width="11"
              height="11"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Business logo"
            />
          )}
          <CardText
            value={d.businessName}
            x={d.logo ? 19 : 5}
            y={10}
            width={d.logo ? 39 : 53}
            size={2.8}
            limit={25}
          />
          <TapIcon x={69} y={5} color={color} />
          <CardText
            value={d.fullName || "Your full name"}
            x={5}
            y={27}
            width={44}
            size={4}
            limit={20}
            maxLines={3}
            fontWeight="700"
          />
          <CardText
            value={d.position}
            x={5}
            y={43}
            width={44}
            size={2.8}
            limit={26}
          />
        </>
      ) : (
        <>
          <CardText
            value={d.fullName || "Your full name"}
            x={42.8}
            y={10}
            width={73}
            size={3.4}
            maxLines={1}
            textAnchor="middle"
            fontWeight="700"
          />
          <TapIcon x={12} y={24} color={color} />
          {d.logo && (
            <image
              href={d.logo}
              x="65"
              y="24"
              width="11"
              height="11"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Business logo"
            />
          )}
        </>
      )}
      {url ? (
        <QRCodeSVG
          x={qrX}
          y={qrY}
          value={url}
          size={27}
          level="M"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
          title="Scan to open your published profile"
        />
      ) : (
        <g>
          <rect
            x={qrX}
            y={qrY}
            width="27"
            height="27"
            fill="#ffffff"
            stroke="#d6d6d6"
            strokeWidth="0.25"
          />
          <text
            x={qrX + 13.5}
            y={qrY + 12}
            textAnchor="middle"
            fontSize="2.6"
            fill="#555555"
          >
            QR after
          </text>
          <text
            x={qrX + 13.5}
            y={qrY + 16}
            textAnchor="middle"
            fontSize="2.6"
            fill="#555555"
          >
            publishing
          </text>
        </g>
      )}
      <text
        x={front ? 67.5 : 42.8}
        y={front ? 49 : 48}
        textAnchor="middle"
        fontSize="2.3"
      >
        TAP OR SCAN TO CONNECT
      </text>
    </svg>
  );
}

export default function PhysicalCard({ document }) {
  const [side, setSide] = useState("front");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef();
  const { notify } = useFeedback();
  const url =
    document.publishedAt && document.id
      ? preferredPublicUrl(document.publishedUrl) || profileUrl(document.id)
      : "";
  const ready = Boolean(
    url && isPublicHost(url) && document.details.fullName.trim(),
  );
  const download = async (format) => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const blob = await physicalCardBlob(svgRef.current, format);
      downloadBlob(blob, `folio-${document.id}-card-${side}.${format}`);
      notify(
        `${side === "front" ? "Front" : "Back"} card downloaded with 3 mm bleed.`,
      );
    } catch (error) {
      notify(
        error.message || "Could not export the card. Please try again.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="physical-card-panel"
      aria-label="Custom physical NFC card"
    >
      <div className="physical-card-heading">
        <CreditCard size={19} />
        <h3>Physical NFC card</h3>
        <span>PRINT DESIGN</span>
      </div>
      <p>
        Your full name, job title, business logo, and colors update
        automatically from your page.
      </p>
      <div className="physical-card-sides" role="group" aria-label="Card side">
        {["front", "back"].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={side === value}
            disabled={busy}
            onClick={() => setSide(value)}
          >
            {value === "front" ? "Front" : "Back"}
          </button>
        ))}
      </div>
      <div className="physical-card-stage">
        <PhysicalCardArtwork
          document={document}
          side={side}
          url={url}
          svgRef={svgRef}
        />
      </div>
      <p className="physical-card-spec">
        85.6 × 53.98 mm · 3 mm bleed in downloads
      </p>
      <div className="physical-card-downloads">
        <button
          className="btn btn-secondary btn-small"
          disabled={!ready || busy}
          onClick={() => download("svg")}
        >
          {busy ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <Download size={14} />
          )}{" "}
          Download {side} SVG
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={!ready || busy}
          onClick={() => download("png")}
        >
          Download {side} PNG
        </button>
      </div>
      {!ready && (
        <p className="physical-card-note">
          Generate your page on a public host to enable print downloads with a
          working QR code.
        </p>
      )}
      <details className="physical-card-instructions">
        <summary>Customize & print instructions</summary>
        <p>
          Edit Your details for the name, title, and logo. Use Make it yours to
          change the colors. Download each side separately.
        </p>
        <p>
          Give your printer the SVG files or 2164 × 1417 px PNGs. Artwork size:
          91.6 × 59.98 mm including bleed; trim 3 mm from each edge. Print at
          actual size, without fit-to-page. Confirm the printer’s template and
          color requirements before production.
        </p>
        <p>
          The tap icon is printed artwork. Write the same published profile URL
          to the NFC chip using an NFC-writing app, then test both tap and QR
          scan before printing a batch.
        </p>
      </details>
    </section>
  );
}
