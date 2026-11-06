import { themes } from "../data/presets.js";
import {
  backgroundStyles,
  buttonLayouts,
  buttonStyles,
  colorKeys,
  coverGradient,
  designDefaults,
  fontOptions,
  headerLayouts,
  iconStyles,
} from "../data/design.js";

// Old drafts retain their original layout. Validate every saved value before CSS.
export function normalizeDesign(value = {}) {
  const preset = themes.find((theme) => theme.id === value?.id) || themes[3];
  const design = { ...preset, ...designDefaults };
  for (const key of colorKeys) {
    if (/^#[0-9a-f]{6}$/i.test(value?.[key])) design[key] = value[key];
  }
  const options = {
    headerLayout: headerLayouts,
    buttonLayout: buttonLayouts,
    backgroundStyle: backgroundStyles,
    iconStyle: iconStyles,
    font: fontOptions,
    buttonStyle: buttonStyles,
  };
  for (const [key, values] of Object.entries(options)) {
    if (values.some((option) => option.id === value?.[key]))
      design[key] = value[key];
  }
  if (Number.isFinite(value?.radius))
    design.radius = Math.min(28, Math.max(0, value.radius));
  design.cover = coverGradient(design);
  return design;
}
