import { useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  Crop,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";
import { Modal, useFeedback } from "./UI";

export default function ImageUpload({
  label,
  value,
  onChange,
  name,
  aspectRatio = 1,
  outputWidth = 512,
  preservePortrait = false,
}) {
  const [source, setSource] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef();
  const fileRef = useRef();
  const { notify } = useFeedback();
  const scale = loaded
    ? Math.min(
        1,
        outputWidth / Math.max(loaded.naturalWidth, loaded.naturalHeight),
      )
    : 1;
  const canvasWidth =
    preservePortrait && loaded
      ? Math.max(1, Math.round(loaded.naturalWidth * scale))
      : outputWidth;
  const outputHeight =
    preservePortrait && loaded
      ? Math.max(1, Math.round(loaded.naturalHeight * scale))
      : Math.round(outputWidth / aspectRatio);
  useEffect(() => {
    if (!source) return;
    const image = new Image();
    let active = true;
    image.onload = () => {
      if (!active) return;
      if (!image.naturalWidth || !image.naturalHeight) {
        notify(
          "This image has no usable dimensions. Choose another image.",
          "error",
        );
        setSource(null);
        return;
      }
      setLoaded(image);
    };
    image.onerror = () => {
      if (active) {
        notify(
          "This file could not be decoded as an image. It may be damaged or use a format this browser does not support.",
          "error",
        );
        setSource(null);
      }
    };
    image.src = source;
    return () => {
      active = false;
      URL.revokeObjectURL(source);
    };
  }, [source]);
  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    const canvas = canvasRef.current,
      ctx = canvas.getContext("2d");
    if (preservePortrait) {
      ctx.clearRect(0, 0, canvasWidth, outputHeight);
      ctx.drawImage(loaded, 0, 0, canvasWidth, outputHeight);
      return;
    }
    const sourceWidth =
      Math.min(loaded.naturalWidth, loaded.naturalHeight * aspectRatio) / zoom;
    const sourceHeight = sourceWidth / aspectRatio;
    const sx = ((loaded.naturalWidth - sourceWidth) * x) / 100;
    const sy = ((loaded.naturalHeight - sourceHeight) * y) / 100;
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(
      loaded,
      sx,
      sy,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );
  }, [
    loaded,
    source,
    zoom,
    x,
    y,
    aspectRatio,
    outputWidth,
    outputHeight,
    canvasWidth,
    preservePortrait,
  ]);
  const choose = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return notify("Please choose an image smaller than 5 MB.", "error");
    setLoaded(null);
    setZoom(1);
    setX(50);
    setY(50);
    setSource(URL.createObjectURL(file));
  };
  const close = () => {
    setSource(null);
    setLoaded(null);
  };
  const apply = async () => {
    if (!loaded) return;
    setBusy(true);
    try {
      onChange(
        name,
        canvasRef.current.toDataURL(
          preservePortrait ? "image/webp" : "image/jpeg",
          preservePortrait ? 0.9 : 0.85,
        ),
      );
      close();
      notify(
        `${label} updated and resized to ${canvasWidth} × ${outputHeight}.`,
      );
    } catch {
      notify("Could not process the image. Try another file.", "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      <div className="image-upload-box">
        <div
          className={`upload-thumb ${preservePortrait ? "portrait-upload-thumb" : name === "profilePhoto" ? "round" : ""}`}
        >
          {value ? (
            <img src={value} alt={`${label} preview`} />
          ) : (
            <ImageIcon size={22} />
          )}
        </div>
        <div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => fileRef.current.click()}
            type="button"
          >
            <Upload size={14} />
            {value ? "Replace image" : "Upload image"}
          </button>
          <p className="field-hint">Any browser-supported image · Up to 5 MB</p>
        </div>
        {value && (
          <button
            type="button"
            className="icon-button remove-image"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={() => onChange(name, "")}
          >
            <X size={17} />
          </button>
        )}
        <input
          className="sr-only"
          tabIndex={-1}
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={choose}
          aria-label={`Upload ${label.toLowerCase()}`}
        />
      </div>
      {preservePortrait && (
        <p className="field-hint">
          Use a transparent PNG or WebP for a background-free portrait. Your
          full image and transparency are preserved; backgrounds are not
          removed. Adjust its size and position in Make it yours.
        </p>
      )}
      {source && (
        <Modal
          title={
            preservePortrait
              ? "Preview your portrait"
              : `Crop your ${label.toLowerCase()}`
          }
          onClose={close}
        >
          <p className="muted text-sm mb-5">
            {preservePortrait
              ? "The complete image is kept at its original proportions, including transparent areas. The checkerboard is only a preview. Replace the image if you need a transparent background."
              : "Move and zoom to find the perfect fit. We’ll resize it for a fast-loading page. Animated images are saved as a still image."}
          </p>
          <div
            className={`crop-preview ${preservePortrait ? "portrait-upload-preview" : name === "profilePhoto" ? "crop-round" : ""}`}
            style={
              preservePortrait
                ? { width: "100%", height: "auto" }
                : aspectRatio !== 1
                  ? {
                      width: "100%",
                      height: "auto",
                      aspectRatio,
                    }
                  : undefined
            }
          >
            <canvas ref={canvasRef} width={canvasWidth} height={outputHeight} />
            {!loaded && <LoaderCircle className="spin" />}
          </div>
          {!preservePortrait &&
            [
              ["Zoom", zoom, setZoom, 1, 3, 0.05],
              ["Horizontal position", x, setX, 0, 100, 1],
              ["Vertical position", y, setY, 0, 100, 1],
            ].map(([text, val, setter, min, max, step]) => (
              <label className="range-field" key={text}>
                <span>{text}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => setter(Number(e.target.value))}
                />
              </label>
            ))}
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!loaded || busy}
              onClick={apply}
            >
              <Crop size={16} />
              {busy ? "Processing…" : "Use this image"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
