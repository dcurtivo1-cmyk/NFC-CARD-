import { preferredPublicUrl } from "./public-url.js";

export function safeUrl(value) {
  if (!value || typeof value !== "string") return "";
  const text = value.trim();
  if (!text || /^(javascript|data|vbscript|file):/i.test(text)) return "";
  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`,
    );
    return ["https:", "http:"].includes(url.protocol) &&
      url.hostname.includes(".")
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export function phoneUrl(phone, whatsapp = false) {
  const clean = String(phone || "")
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");
  if (!/\d/.test(clean)) return "";
  return whatsapp
    ? `https://wa.me/${clean.replace(/\D/g, "")}`
    : `tel:${clean}`;
}

export function validateDetails(details, type = "card") {
  const errors = {};
  if (!details.fullName.trim())
    errors.fullName =
      type === "card"
        ? "Please enter your full name."
        : "Please enter a page or business name.";
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email))
    errors.email = "Enter a valid email address.";
  for (const field of [
    "website",
    "facebook",
    "instagram",
    "tiktok",
    "linkedin",
    "youtube",
    "actionUrl",
  ]) {
    if (details[field] && !safeUrl(details[field]))
      errors[field] = "Enter a valid http or https website address.";
  }
  for (const field of ["phone", "whatsapp"]) {
    if (details[field] && !/^\+?[\d\s().-]{7,24}$/.test(details[field]))
      errors[field] = "Enter a valid phone number, including country code.";
  }
  details.customLinks.forEach((link, i) => {
    if (!link.label.trim())
      errors[`link-label-${i}`] = "Add a label for this link.";
    if (!safeUrl(link.url))
      errors[`link-url-${i}`] = "Enter a valid link address.";
  });
  if (type === "menu")
    details.menuItems.forEach((item, i) => {
      if (!item.name.trim())
        errors[`menu-name-${i}`] = "Give this menu item a name.";
      if (!item.price.trim()) errors[`menu-price-${i}`] = "Add a price.";
    });
  if (["review", "brochure"].includes(type) && !details.actionUrl)
    errors.actionUrl =
      type === "review"
        ? "Add your Google review link."
        : "Add a link to your brochure or services.";
  if (type === "review" && /YOUR_PLACE_ID/.test(details.actionUrl))
    errors.actionUrl = "Replace the sample with your own Google review link.";
  return errors;
}

export function profileUrl(id) {
  return preferredPublicUrl(
    new URL(
      `${import.meta.env.BASE_URL}p/${encodeURIComponent(id)}`,
      window.location.origin,
    ).href,
  );
}

const escapeVCard = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

export function makeVCard(details) {
  const e = escapeVCard;
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${e(details.fullName)}`,
    `N:;${e(details.fullName)};;;`,
    `ORG:${e(details.businessName)}`,
    `TITLE:${e(details.position)}`,
    `EMAIL;TYPE=INTERNET:${e(details.email)}`,
    `TEL;TYPE=CELL:${e(details.phone)}`,
    `URL:${e(safeUrl(details.website))}`,
    `ADR;TYPE=WORK:;;${e(details.address)};;;;`,
    `NOTE:${e(details.bio)}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadVCard(details) {
  downloadBlob(
    new Blob([makeVCard(details)], { type: "text/vcard;charset=utf-8" }),
    `${details.fullName.trim().replace(/[^\p{L}\p{N}-]+/gu, "-") || "contact"}.vcf`,
  );
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.append(el);
  el.select();
  const success = document.execCommand("copy");
  el.remove();
  if (!success)
    throw new Error("Copy unavailable. Select and copy the URL manually.");
}
