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
import {
  copyText,
  downloadBlob,
  downloadVCard,
  profileUrl,
} from "../lib/profile";

export default function ShareModal({ document, onClose }) {
  const url = profileUrl(document.id);
  const qrRef = useRef();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { notify } = useFeedback();
  const copy = async () => {
    try {
      await copyText(url);
      setCopied(true);
      notify(
        "Profile URL copied. It opens where this browser’s profile data is saved.",
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
        Your demo has been saved. Here’s your link and its matching QR code.
      </p>
      <div className="share-qr" ref={qrRef}>
        <QRCodeSVG
          value={url}
          size={184}
          level="M"
          marginSize={4}
          title={`QR code for ${document.details.fullName}`}
        />
        <span>{document.details.displayName || document.details.fullName}</span>
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
        <button className="btn btn-secondary" onClick={() => downloadQR("svg")}>
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
        <strong>This is a local demo link.</strong>
        <p>
          It works in this browser while its saved data exists. A scan on
          another device won’t have that data. Deploying the site alone does not
          publish profiles; persistent backend storage is required for public,
          cross-device sharing.
        </p>
      </div>
    </Modal>
  );
}
