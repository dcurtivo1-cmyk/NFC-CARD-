export const designDefaults = {
  physicalTemplate: "classic",
  templateStyle: "standard",
  headerLayout: "classic",
  buttonLayout: "stacked",
  backgroundStyle: "solid",
  iconStyle: "circle",
  photoStyle: "portrait",
  portraitSize: 100,
  portraitX: 0,
  portraitY: 0,
};

export const photoStyles = [
  {
    id: "circle",
    name: "Circle",
    description: "A round profile photo below the cover.",
  },
  {
    id: "portrait",
    name: "Portrait (no frame)",
    description: "A large, unframed portrait in front of the banner.",
  },
];

export const headerLayouts = [
  {
    id: "classic",
    name: "Classic cover",
    description: "A cover with an overlapping photo.",
  },
  {
    id: "centered",
    name: "Centered",
    description: "Your photo and introduction, centered.",
  },
  {
    id: "split",
    name: "Side by side",
    description: "A compact photo beside your name.",
  },
  {
    id: "minimal",
    name: "Minimal header",
    description: "A clean introduction with an optional cover photo.",
  },
];
export const buttonLayouts = [
  {
    id: "stacked",
    name: "Stacked",
    description: "Full-width links, one per row.",
  },
  {
    id: "grid",
    name: "Two columns",
    description: "Custom links in a tidy two-column grid.",
  },
  {
    id: "compact",
    name: "Compact rows",
    description: "Smaller, left-aligned custom links.",
  },
];
export const backgroundStyles = [
  { id: "solid", name: "Solid", description: "A simple, uninterrupted color." },
  {
    id: "gradient",
    name: "Soft gradient",
    description: "A gentle wash of your palette.",
  },
  {
    id: "dots",
    name: "Dotted",
    description: "A subtle pattern with a little personality.",
  },
  { id: "grid", name: "Fine grid", description: "A light, structured grid." },
];
export const buttonStyles = [
  { id: "filled", name: "Filled" },
  { id: "outline", name: "Outline" },
  { id: "soft", name: "Soft" },
  { id: "elevated", name: "Elevated" },
];
export const iconStyles = [
  { id: "circle", name: "Circle", description: "Soft circular icon badges." },
  {
    id: "rounded",
    name: "Rounded square",
    description: "Friendly, gently rounded squares.",
  },
  {
    id: "outline",
    name: "Outlined icons",
    description: "Clean icons with a fine outline.",
  },
  {
    id: "minimal",
    name: "Minimal icons",
    description: "Just the icon, with no container.",
  },
];
export const fontOptions = [
  {
    id: "sans",
    name: "DM Sans — clean & friendly",
    family: '"DM Sans", "Segoe UI", sans-serif',
  },
  {
    id: "manrope",
    name: "Manrope — modern & geometric",
    family: '"Manrope", "Segoe UI", sans-serif',
  },
  {
    id: "serif",
    name: "Georgia — timeless & expressive",
    family: "Georgia, serif",
  },
  {
    id: "editorial",
    name: "Palatino — soft & editorial",
    family: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
  },
  {
    id: "friendly",
    name: "Trebuchet — warm & approachable",
    family: '"Trebuchet MS", "Segoe UI", sans-serif',
  },
  {
    id: "mono",
    name: "Courier — distinct & precise",
    family: '"Courier New", monospace',
  },
];
export const colorPalettes = [
  {
    id: "lavender",
    name: "Lavender",
    primary: "#7854d5",
    background: "#fcf9ff",
    text: "#302742",
    coverStart: "#c5c4f6",
    coverEnd: "#f6d8c4",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    primary: "#3269d5",
    background: "#f3f7ff",
    text: "#182d4d",
    coverStart: "#dce8ff",
    coverEnd: "#a9c7fb",
  },
  {
    id: "midnight",
    name: "Midnight",
    primary: "#bcb0fa",
    background: "#20212b",
    text: "#f6f4ff",
    coverStart: "#44415d",
    coverEnd: "#22232c",
  },
  {
    id: "sage",
    name: "Sage Green",
    primary: "#376953",
    background: "#f4f8f2",
    text: "#243e31",
    coverStart: "#d4e5c9",
    coverEnd: "#a6c9b7",
  },
  {
    id: "sunset",
    name: "Warm Sunset",
    primary: "#ad493b",
    background: "#fff7f1",
    text: "#542e29",
    coverStart: "#f3c4a6",
    coverEnd: "#eeb3bd",
  },
  {
    id: "sand",
    name: "Golden Sand",
    primary: "#7c6751",
    background: "#faf6ef",
    text: "#3e352b",
    coverStart: "#e3d9c7",
    coverEnd: "#c9b89b",
  },
  {
    id: "mono",
    name: "Monochrome",
    primary: "#34383d",
    background: "#ffffff",
    text: "#24272b",
    coverStart: "#ecece8",
    coverEnd: "#d7dbd3",
  },
];
export const colorKeys = [
  "primary",
  "background",
  "text",
  "coverStart",
  "coverEnd",
];
export function coverGradient(design) {
  return `linear-gradient(125deg, ${design.coverStart}, ${design.coverEnd})`;
}
export function applyPalette(design, palette) {
  const colors = Object.fromEntries(
    colorKeys.map((key) => [key, palette[key]]),
  );
  return { ...design, ...colors, cover: coverGradient(colors) };
}
