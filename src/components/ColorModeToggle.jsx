import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "folio-studio-color-mode";

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function resolveMode(preference) {
  return preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : preference;
}

function applyMode(mode) {
  document.documentElement.dataset.colorMode = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#15131d" : "#fbfaf8");
}

export default function ColorModeToggle() {
  const [preference, setPreference] = useState(readPreference);
  const [mode, setMode] = useState(() => resolveMode(preference));

  useEffect(() => {
    const sync = () => {
      const next = resolveMode(preference);
      applyMode(next);
      setMode(next);
    };
    sync();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", sync);
    const storageChanged = (event) => {
      if (event.key === STORAGE_KEY || event.key === null)
        setPreference(readPreference());
    };
    window.addEventListener("storage", storageChanged);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", storageChanged);
    };
  }, [preference]);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    applyMode(next);
    setMode(next);
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* The toggle still works for this visit if storage is unavailable. */
    }
  };
  const label =
    mode === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className="icon-button color-mode-toggle"
      onClick={toggle}
      aria-label={label}
      aria-pressed={mode === "dark"}
      title={label}
    >
      {mode === "dark" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
