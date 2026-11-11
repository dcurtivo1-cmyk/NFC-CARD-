export const physicalCardTemplates = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Bold typography, a signature side stripe, and generous space.",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy, fine gold geometry, and elegant serif lettering.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "A typographic white card with a discreet brand footer.",
  },
  {
    id: "split",
    name: "Split",
    description: "A colored brand rail and a spacious personal introduction.",
  },
  {
    id: "wave",
    name: "Wave",
    description: "Soft flowing shapes in your brand color.",
  },
  {
    id: "outline",
    name: "Outline",
    description:
      "A centered introduction framed by a fine brand-colored border.",
  },
];

export function physicalCardStyle(design) {
  const id = physicalCardTemplates.some(
    (item) => item.id === design.physicalTemplate,
  )
    ? design.physicalTemplate
    : "classic";
  return {
    id,
    background:
      id === "midnight"
        ? "#151e30"
        : ["minimal", "split", "outline"].includes(id)
          ? "#ffffff"
          : design.background,
    text:
      id === "midnight"
        ? "#fff8e7"
        : ["minimal", "split", "outline"].includes(id)
          ? "#18202d"
          : design.text,
    accent:
      id === "midnight"
        ? "#d7b775"
        : id === "minimal"
          ? "#18202d"
          : design.primary,
    brandText: contrastText(design.primary),
  };
}

function contrastText(hex) {
  const channels = (hex.match(/[a-f\d]{2}/gi) || ["00", "00", "00"]).map(
    (part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    },
  );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 >
    0.179
    ? "#111111"
    : "#ffffff";
}
