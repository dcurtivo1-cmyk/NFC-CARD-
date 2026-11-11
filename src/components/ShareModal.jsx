import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Download,
  Check,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
} from "lucide-react";
import { Modal, useFeedback } from "./UI";
import PhysicalCard from "./PhysicalCard";
import { isPublicHost, publishPage } from "../lib/publishing";
import { saveDocument } from "../lib/storage";
import { preferredPublicUrl } from "../lib/public-url";
import {
  copyText,
  downloadBlob,
  downloadVCard,
  profileUrl,
} from "../lib/profile";

export default function ShareModal({
  document: initialDocument,
  onClose,
  onPublished,
}) {
  const [document, setDocument] = useState(initialDocument);
  const [publishing, setPublishing] = useState(false);
  const [cardChanged, setCardChanged] = useState(false);
  const published = Boolean(document.publishedAt);
  const url =
    preferredPublicUrl(document.publishedUrl) || profileUrl(document.id);
  const publicHost = isPublicHost(url);
  const qrRef = useRef();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { notify } = useFeedback();
  const publish = async () => {
    setPublishing(true);
    try {
      const next = await publishPage(document);
      setDocument(next);
      setCardChanged(false);
      onPublished?.(next);
      try {
        saveDocument(next, "generated");
      } catch {
        notify(
          "Published, but the local publishing status could not be saved.",
          "info",
        );
      }
      notify("Your page is published. Updates will keep the same URL.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setPublishing(false);
    }
  };
  const copy = async () => {
    try {
      await copyText(url);
      setCopied(true);
      notify(
        publicHost
          ? "Published URL copied. Write this URL to your NFC card."
          : "Development URL copied. Use a public HTTPS host for NFC cards.",
      );
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const downloadQR = async (format) => {
    const svg = qrRef.current.querySelector("svg");
    const source = new XMLSerializer().serializeToString(svg);
    if (format === "svg") {
      downloadBlob(
        new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
        `folio-${document.id}-qr.svg`,
      );
      notify("QR code downloaded as SVG.");
      return;
    }
    setDownloading(true);
    try {
      const image = new Image();
      const objectUrl = URL.createObjectURL(
        new Blob([source], { type: "image/svg+xml" }),
      );
      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = objectUrl;
        });
        const canvas = window.document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        canvas.getContext("2d").drawImage(image, 0, 0, 1024, 1024);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) throw new Error();
        downloadBlob(blob, `folio-${document.id}-qr.png`);
        notify("QR code downloaded as a 1024 px PNG.");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      notify("PNG export failed. Please try the SVG download.", "error");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Modal title="A little page, ready to go." onClose={onClose}>
      <p className="muted text-sm">
        {published
          ? "Your page is published. Use the same link for your NFC card and QR code."
          : "Publish this saved demo so anyone with the link can open it."}
      </p>
      {!published && (
        <button
          className="btn btn-primary"
          disabled={publishing}
          onClick={publish}
        >
          {publishing && <LoaderCircle size={16} className="spin" />}{" "}
          {publishing ? "Publishing…" : "Publish page"}
        </button>
      )}
      {published && (
        <>
          <div className="share-qr" ref={qrRef}>
            <QRCodeSVG
              value={url}
              size={184}
              level="M"
              marginSize={4}
              title={`QR code for ${document.details.fullName}`}
            />
            <span>
              {document.details.displayName || document.details.fullName}
            </span>
          </div>
          <label className="field-label" htmlFor="share-url">
            Your actual profile URL
          </label>
          <div className="copy-input">
            <LinkIcon size={16} />
            <input
              id="share-url"
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
            />
            <button
              className="icon-button"
              onClick={copy}
              aria-label="Copy shareable URL"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
          <div className="share-downloads">
            <button
              className="btn btn-primary"
              disabled={downloading}
              onClick={() => downloadQR("png")}
            >
              {downloading ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Download size={16} />
              )}
              Download QR · PNG
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => downloadQR("svg")}
            >
              SVG
            </button>
          </div>
          <div className="share-other-actions">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open profile <ExternalLink size={14} />
            </a>
            {document.type === "card" && (
              <button
                onClick={() => {
                  downloadVCard(document.details);
                  notify("Contact downloaded.");
                }}
              >
                Export contact (.vcf) <Download size={14} />
              </button>
            )}
          </div>
          <div className="share-warning">
            <strong>
              {publicHost
                ? "Ready for your NFC card."
                : "Development link — public hosting needed for NFC."}
            </strong>
            <p>
              {publicHost
                ? "In your NFC writing app, choose URL / Website and paste this link. Write it to the card, then tap it with another phone to open your page. Future published edits keep this URL."
                : "This page is saved on the development server. Publish the app with its database on a public HTTPS domain, then generate your NFC link there. A localhost or private-network URL will not work on other phones."}
            </p>
          </div>
        </>
      )}
      <PhysicalCard
        document={document}
        disabled={publishing}
        onTemplateChange={(physicalTemplate) => {
          setDocument((doc) => ({
            ...doc,
            design: { ...doc.design, physicalTemplate },
          }));
          setCardChanged(true);
        }}
      />
      {cardChanged && (
        <div className="physical-card-save">
          <p className="muted text-sm">
            Save this template to keep it the next time you open your card.
          </p>
          <button
            className="btn btn-primary"
            disabled={publishing}
            onClick={publish}
          >
            {publishing && <LoaderCircle size={16} className="spin" />}
            {publishing ? "Saving card design…" : "Save card design"}
          </button>
        </div>
      )}
    </Modal>
  );
}
