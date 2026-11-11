export const CARD_SIZE = { width: 85.6, height: 53.98, bleed: 3 };

// Keep the entire value, including long unbroken names, within the print area.
export function cardTextLines(value, limit = 24, maxLines = 3) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (
      line &&
      `${line} ${word}`.length > limit &&
      lines.length < maxLines - 1
    ) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export async function physicalCardBlob(element, format) {
  const svg = element.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", `${CARD_SIZE.width + 6}mm`);
  svg.setAttribute("height", `${CARD_SIZE.height + 6}mm`);
  svg.setAttribute("viewBox", "-3 -3 91.6 59.98");
  svg.removeAttribute("class");
  // Embed logos so printer files never depend on a browser session or remote URL.
  for (const image of svg.querySelectorAll("image")) {
    const href = image.getAttribute("href");
    if (!href?.startsWith("data:")) {
      const response = await fetch(href);
      if (!response.ok)
        throw new Error("Could not embed the logo. Upload it again and retry.");
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        response.blob().then((blob) => reader.readAsDataURL(blob), reject);
      });
      image.setAttribute("href", dataUrl);
    }
  }
  const source = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  if (format === "svg") return source;
  const objectUrl = URL.createObjectURL(source);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Image export failed. Try the SVG download."));
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    // 600 pixels per inch at the full size including bleed.
    canvas.width = Math.round((91.6 / 25.4) * 600);
    canvas.height = Math.round((59.98 / 25.4) * 600);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Image export failed. Try the SVG download.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
