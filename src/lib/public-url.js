const PUBLIC_ORIGIN = "https://nfc-card-five.vercel.app";
const PREVIOUS_ORIGIN = "https://folio-nfc-studio.buffhutch.chatgpt.site";

// Keep profile IDs and paths stable when reading older saved share links.
export function preferredPublicUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.origin === PREVIOUS_ORIGIN) {
      return new URL(url.pathname + url.search + url.hash, PUBLIC_ORIGIN).href;
    }
    return url.href;
  } catch {
    return null;
  }
}
