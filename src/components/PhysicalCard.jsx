import { useRef, useState } from "react";
import { CreditCard, Download, LoaderCircle } from "lucide-react";
import PhysicalCardArtwork from "./PhysicalCardArtwork";
import { preferredPublicUrl } from "../lib/public-url";
import { isPublicHost } from "../lib/publishing";
import { downloadBlob, profileUrl } from "../lib/profile";
import { physicalCardBlob } from "../lib/physical-card";
import { useFeedback } from "./UI";
import {
  physicalCardTemplates,
  physicalCardStyle,
} from "../data/physical-card";

export default function PhysicalCard({
  document,
  onTemplateChange,
  disabled = false,
}) {
  const [side, setSide] = useState("front");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef();
  const { notify } = useFeedback();
  const selectedTemplate = physicalCardStyle(document.design).id;
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
        Your name, title, logo, and tap icon on the front. Your QR code on the
        back. Choose a template to make it yours.
      </p>
      {onTemplateChange && (
        <fieldset
          className="physical-template-picker"
          disabled={busy || disabled}
        >
          <legend>Choose a card template</legend>
          <div className="physical-template-grid">
            {physicalCardTemplates.map((template) => (
              <button
                type="button"
                key={template.id}
                aria-label={template.name}
                aria-pressed={selectedTemplate === template.id}
                onClick={() => onTemplateChange(template.id)}
                title={template.description}
              >
                <span aria-hidden="true">
                  <PhysicalCardArtwork
                    document={{
                      ...document,
                      design: {
                        ...document.design,
                        physicalTemplate: template.id,
                      },
                    }}
                    side="front"
                    thumbnail
                  />
                </span>
                <strong>{template.name}</strong>
                <small>
                  {selectedTemplate === template.id
                    ? "Selected"
                    : "Select template"}
                </small>
              </button>
            ))}
          </div>
        </fieldset>
      )}
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
        {side === "front" ? "Front · Name & brand" : "Back · QR & tap"}
        <br />
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
          Choose a template above. Edit Your details for the name, title, and
          logo. Classic and Wave follow your page colors; Split and Outline use
          your brand accent. Midnight and Minimal have their own print palettes.
          Download each side separately.
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
